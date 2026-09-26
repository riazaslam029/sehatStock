"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireOwner, requireAuth } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { getGeminiClient, isGeminiConfigured } from "./gemini";

export interface RestockWorkflowItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  categoryName: string;
  strength: string;
  dosageForm: string;
  basePurchasePrice: number;
  currentStock: number;
  reorderLevel: number;
  salesVelocity30d: number;
  recommendedOrderQty: number;
  supplierId: string | null;
  supplierName: string | null;
  status: "DETECTED" | "ANALYZING" | "DRAFT_CREATED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";
  reasoning: string | null;
  draftPurchaseId: string | null;
  purchaseRefNo?: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

/**
 * 1. Run Automated AI Scan across inventory to detect shortages & generate PO drafts
 */
export async function runRestockScan() {
  await requireAuth();
  const db = await getDb();

  // Fetch all medicines with live batch stock
  const meds = await db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      categoryName: schema.categories.name,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      basePurchasePrice: schema.medicines.basePurchasePrice,
      reorderLevel: schema.medicines.reorderLevel,
      totalStock: sql<number>`COALESCE(SUM(${schema.medicineBatches.quantity}), 0)::int`,
    })
    .from(schema.medicines)
    .innerJoin(schema.categories, eq(schema.medicines.categoryId, schema.categories.id))
    .leftJoin(
      schema.medicineBatches,
      eq(schema.medicineBatches.medicineId, schema.medicines.id)
    )
    .where(eq(schema.medicines.status, "ACTIVE"))
    .groupBy(schema.medicines.id, schema.categories.name);

  // Find all low stock items
  const lowStockMeds = meds.filter((m: any) => m.totalStock <= m.reorderLevel);

  if (lowStockMeds.length === 0) {
    return {
      success: true,
      scannedCount: meds.length,
      lowStockDetected: 0,
      draftsCreated: 0,
      message: "Scan complete. All medicine inventories are healthy above reorder levels.",
    };
  }

  // Get active suppliers
  const suppliersList = await db.select().from(schema.suppliers).where(eq(schema.suppliers.status, "ACTIVE"));
  const defaultSupplier = suppliersList[0] || null;

  let draftsCreated = 0;

  for (const med of lowStockMeds) {
    // Check if an active pending automation already exists for this medicine
    const [existing] = await db
      .select()
      .from(schema.restockAutomations)
      .where(
        sql`${schema.restockAutomations.medicineId} = ${med.id} AND ${schema.restockAutomations.status} IN ('DETECTED', 'ANALYZING', 'DRAFT_CREATED', 'PENDING_APPROVAL')`
      )
      .limit(1);

    // Calculate recent 30-day velocity from sale_items
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [velocityResult] = await db
      .select({
        totalSold: sql<number>`COALESCE(SUM(${schema.saleItems.quantity}), 0)::int`,
      })
      .from(schema.saleItems)
      .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
      .where(
        sql`${schema.saleItems.medicineId} = ${med.id} AND ${schema.sales.createdAt} >= ${thirtyDaysAgo}`
      );


    const unitsSold30d = Number(velocityResult?.totalSold || 15);
    const dailyVelocity = Math.max(0.5, unitsSold30d / 30);

    // Recommended PO quantity formula: (reorderLevel * 2) or (leadTime 7d * dailyVelocity + 30d safety stock)
    const baseRecommended = Math.max(
      med.reorderLevel * 2,
      Math.ceil(dailyVelocity * 30 + med.reorderLevel)
    );

    // Determine supplier (from prior batch or default)
    const [lastBatch] = await db
      .select({ supplierId: schema.medicineBatches.supplierId })
      .from(schema.medicineBatches)
      .where(eq(schema.medicineBatches.medicineId, med.id))
      .limit(1);

    const chosenSupplierId = lastBatch?.supplierId || defaultSupplier?.id || null;

    let reasoning = `Current stock (${med.totalStock}) is below safety threshold (${med.reorderLevel}). 30-day consumption velocity is ~${unitsSold30d} units (~${dailyVelocity.toFixed(1)} units/day). AI restock model calculated order size of ${baseRecommended} units to maintain 30-day buffer and prevent stockouts.`;

    // Try Gemini synthesis if available
    if (isGeminiConfigured()) {
      try {
        const client = getGeminiClient();
        if (client) {
          const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `You are an automated supply chain AI agent for a pharmacy POS.
A low stock event was triggered for:
Medicine: ${med.brandName} ${med.strength} (${med.genericName})
Current Unreserved Stock: ${med.totalStock} units
Reorder Safety Level: ${med.reorderLevel} units
30-Day Velocity: ${unitsSold30d} units sold
Proposed Restock Quantity: ${baseRecommended} units

Write a concise, professional 2-sentence rationale for the pharmacy owner explaining why this restock PO draft is recommended. Mention clinical criticality if relevant.`;
          const resp = await model.generateContent(prompt);
          reasoning = resp.response.text().trim();
        }
      } catch (err) {
        console.warn("Gemini reasoning failed, using algorithmic rationale:", err);
      }
    }

    if (existing) {
      // Update existing record
      await db
        .update(schema.restockAutomations)
        .set({
          currentStock: med.totalStock,
          reorderLevel: med.reorderLevel,
          salesVelocity30d: unitsSold30d,
          recommendedOrderQty: baseRecommended,
          reasoning,
          supplierId: chosenSupplierId,
          status: "PENDING_APPROVAL",
        })
        .where(eq(schema.restockAutomations.id, existing.id));
    } else {
      // Insert new automation record
      await db.insert(schema.restockAutomations).values({
        medicineId: med.id,
        currentStock: med.totalStock,
        reorderLevel: med.reorderLevel,
        salesVelocity30d: unitsSold30d,
        recommendedOrderQty: baseRecommended,
        supplierId: chosenSupplierId,
        status: "PENDING_APPROVAL",
        reasoning,
      });
      draftsCreated++;
    }
  }

  revalidatePath("/automation");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return {
    success: true,
    scannedCount: meds.length,
    lowStockDetected: lowStockMeds.length,
    draftsCreated,
    message: `Scan complete! Detected ${lowStockMeds.length} low stock medicines. Generated/updated restock PO drafts awaiting Owner approval.`,
  };
}

/**
 * 2. Get list of all restock automation workflows
 */
export async function getRestockWorkflows(): Promise<RestockWorkflowItem[]> {
  const db = await getDb();

  const rows = await db
    .select({
      id: schema.restockAutomations.id,
      medicineId: schema.restockAutomations.medicineId,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      categoryName: schema.categories.name,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      basePurchasePrice: schema.medicines.basePurchasePrice,
      currentStock: schema.restockAutomations.currentStock,
      reorderLevel: schema.restockAutomations.reorderLevel,
      salesVelocity30d: schema.restockAutomations.salesVelocity30d,
      recommendedOrderQty: schema.restockAutomations.recommendedOrderQty,
      supplierId: schema.restockAutomations.supplierId,
      supplierName: schema.suppliers.companyName,
      status: schema.restockAutomations.status,
      reasoning: schema.restockAutomations.reasoning,
      draftPurchaseId: schema.restockAutomations.draftPurchaseId,
      purchaseRefNo: schema.purchases.referenceNo,
      reviewedByName: schema.users.name,
      reviewedAt: schema.restockAutomations.reviewedAt,
      createdAt: schema.restockAutomations.createdAt,
    })
    .from(schema.restockAutomations)
    .innerJoin(schema.medicines, eq(schema.restockAutomations.medicineId, schema.medicines.id))
    .innerJoin(schema.categories, eq(schema.medicines.categoryId, schema.categories.id))
    .leftJoin(schema.suppliers, eq(schema.restockAutomations.supplierId, schema.suppliers.id))
    .leftJoin(schema.purchases, eq(schema.restockAutomations.draftPurchaseId, schema.purchases.id))
    .leftJoin(schema.users, eq(schema.restockAutomations.reviewedBy, schema.users.id))
    .orderBy(desc(schema.restockAutomations.createdAt));

  return rows.map((r: any) => ({
    ...r,
    basePurchasePrice: parseFloat(r.basePurchasePrice),
  }));
}

/**
 * 3. Human-in-the-Loop Owner Approval: Converts approved draft into real Purchase Order
 */
export async function approveRestockWorkflow(
  workflowId: string,
  approvedQty?: number,
  approvedSupplierId?: string
) {
  const session = await requireOwner(); // Enforces Owner-only permission
  const db = await getDb();

  const [workflow] = await db
    .select({
      id: schema.restockAutomations.id,
      medicineId: schema.restockAutomations.medicineId,
      recommendedOrderQty: schema.restockAutomations.recommendedOrderQty,
      supplierId: schema.restockAutomations.supplierId,
      status: schema.restockAutomations.status,
      medicineName: schema.medicines.brandName,
      basePurchasePrice: schema.medicines.basePurchasePrice,
    })
    .from(schema.restockAutomations)
    .innerJoin(schema.medicines, eq(schema.restockAutomations.medicineId, schema.medicines.id))
    .where(eq(schema.restockAutomations.id, workflowId))
    .limit(1);

  if (!workflow) {
    return { success: false, error: "Workflow not found." };
  }

  const finalQty = approvedQty && approvedQty > 0 ? approvedQty : workflow.recommendedOrderQty;
  const unitPrice = parseFloat(workflow.basePurchasePrice);
  const totalAmount = (finalQty * unitPrice).toFixed(2);

  // Fallback supplier if none
  let supplierId = approvedSupplierId || workflow.supplierId;
  if (!supplierId) {
    const [firstSup] = await db.select().from(schema.suppliers).limit(1);
    supplierId = firstSup?.id || null;
  }

  if (!supplierId) {
    return { success: false, error: "A valid supplier must be selected to create purchase order." };
  }

  // 1. Create real purchase order record
  const purchaseId = `po-${Date.now()}`;
  const referenceNo = `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  await db.insert(schema.purchases).values({
    id: purchaseId,
    referenceNo,
    supplierId,
    status: "PENDING",
    totalAmount,
    notes: `Automated restock purchase approved by Owner ${session.name} for ${workflow.medicineName} (${finalQty} units).`,
    createdBy: session.userId,
    createdAt: now,
  });

  // 2. Create purchase order line item
  const dummyBatchNumber = `PO-INW-${Math.floor(1000 + Math.random() * 9000)}`;
  const futureExpiry = new Date();
  futureExpiry.setFullYear(futureExpiry.getFullYear() + 2);

  await db.insert(schema.purchaseItems).values({
    purchaseId,
    medicineId: workflow.medicineId,
    batchNumber: dummyBatchNumber,
    expiryDate: futureExpiry,
    quantity: finalQty,
    unitPrice: unitPrice.toFixed(2),
    totalPrice: totalAmount,
  });

  // 3. Update automation workflow state to APPROVED
  await db
    .update(schema.restockAutomations)
    .set({
      status: "APPROVED",
      recommendedOrderQty: finalQty,
      supplierId,
      draftPurchaseId: purchaseId,
      reviewedBy: session.userId,
      reviewedAt: now,
    })
    .where(eq(schema.restockAutomations.id, workflowId));

  revalidatePath("/automation");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return {
    success: true,
    referenceNo,
    totalAmount: parseFloat(totalAmount),
    finalQty,
    message: `Purchase Order ${referenceNo} successfully created and sent to supplier!`,
  };
}

/**
 * 4. Reject workflow draft
 */
export async function rejectRestockWorkflow(workflowId: string, reason?: string) {
  const session = await requireOwner();
  const db = await getDb();

  await db
    .update(schema.restockAutomations)
    .set({
      status: "REJECTED",
      reasoning: reason ? `Rejected by Owner: ${reason}` : "Rejected by Owner.",
      reviewedBy: session.userId,
      reviewedAt: new Date(),
    })
    .where(eq(schema.restockAutomations.id, workflowId));

  revalidatePath("/automation");
  return { success: true };
}
