"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, asc, desc } from "drizzle-orm";
import { requireAuth, requireOwner } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface BatchItem {
  id: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  quantity: number;
  supplierName: string;
  daysToExpiry: number;
  expiryStatus: "EXPIRED" | "NEAR_EXPIRY" | "HEALTHY";
}

export async function getInventoryBatches(medicineId?: string): Promise<BatchItem[]> {
  const db = await getDb();
  const now = new Date();

  const query = db
    .select({
      id: schema.medicineBatches.id,
      batchNumber: schema.medicineBatches.batchNumber,
      medicineId: schema.medicineBatches.medicineId,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      expiryDate: schema.medicineBatches.expiryDate,
      purchasePrice: schema.medicineBatches.purchasePrice,
      sellingPrice: schema.medicineBatches.sellingPrice,
      quantity: schema.medicineBatches.quantity,
      supplierName: schema.suppliers.companyName,
    })
    .from(schema.medicineBatches)
    .innerJoin(schema.medicines, eq(schema.medicineBatches.medicineId, schema.medicines.id))
    .leftJoin(schema.suppliers, eq(schema.medicineBatches.supplierId, schema.suppliers.id))
    .orderBy(asc(schema.medicineBatches.expiryDate)); // FEFO Default

  const rows = await query;
  let filtered = rows;
  if (medicineId) {
    filtered = rows.filter((r: any) => r.medicineId === medicineId);
  }

  return filtered.map((r: any) => {
    const exp = new Date(r.expiryDate);
    const diffTime = exp.getTime() - now.getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let expiryStatus: "EXPIRED" | "NEAR_EXPIRY" | "HEALTHY" = "HEALTHY";
    if (daysToExpiry <= 0) {
      expiryStatus = "EXPIRED";
    } else if (daysToExpiry <= 30) {
      expiryStatus = "NEAR_EXPIRY";
    }

    return {
      ...r,
      expiryDate: exp.toISOString().split("T")[0],
      daysToExpiry,
      expiryStatus,
      supplierName: r.supplierName || "Direct / Local",
    };
  });
}

export async function getInventorySummary() {
  const db = await getDb();
  const allBatches = await getInventoryBatches();
  const allMeds = await db.select().from(schema.medicines);

  let totalValuation = 0;
  let totalUnits = 0;
  let nearExpiryCount = 0;
  let expiredCount = 0;

  const stockPerMed: Record<string, number> = {};

  for (const b of allBatches) {
    totalUnits += b.quantity;
    totalValuation += b.quantity * parseFloat(b.sellingPrice);
    if (b.expiryStatus === "NEAR_EXPIRY") nearExpiryCount++;
    if (b.expiryStatus === "EXPIRED") expiredCount++;

    stockPerMed[b.medicineId] = (stockPerMed[b.medicineId] || 0) + b.quantity;
  }

  let lowStockCount = 0;
  for (const m of allMeds) {
    const currentStock = stockPerMed[m.id] || 0;
    if (currentStock <= m.reorderLevel) {
      lowStockCount++;
    }
  }

  return {
    totalValuation,
    totalUnits,
    totalSKUs: allMeds.length,
    nearExpiryCount,
    expiredCount,
    lowStockCount,
  };
}

export async function adjustStockAction(data: {
  batchId: string;
  adjustmentQty: number; // e.g. +10 or -5
  movementType: "PURCHASE" | "ADJUSTMENT" | "EXPIRED" | "DAMAGE";
  notes?: string;
}) {
  const session = await requireAuth();
  const db = await getDb();

  const [batch] = await db
    .select()
    .from(schema.medicineBatches)
    .where(eq(schema.medicineBatches.id, data.batchId))
    .limit(1);

  if (!batch) {
    return { success: false, error: "Batch not found." };
  }

  const newQty = batch.quantity + data.adjustmentQty;
  if (newQty < 0) {
    return { success: false, error: "Resulting stock quantity cannot be negative." };
  }

  // Transactional update
  await db
    .update(schema.medicineBatches)
    .set({ quantity: newQty })
    .where(eq(schema.medicineBatches.id, data.batchId));

  // Immutable Stock Movement Audit Record
  await db.insert(schema.stockMovements).values({
    medicineId: batch.medicineId,
    batchId: batch.id,
    movementType: data.movementType,
    quantity: data.adjustmentQty,
    balanceAfter: newQty,
    notes: data.notes || `Manual adjustment by ${session.name}`,
    createdBy: session.userId,
  });

  revalidatePath("/inventory");
  revalidatePath("/medicines");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true, newQuantity: newQty };
}

export async function createBatchAction(data: {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  quantity: number;
  supplierId?: string;
}) {
  const session = await requireOwner();
  const db = await getDb();

  const batchId = `batch-${Date.now()}`;
  await db.insert(schema.medicineBatches).values({
    id: batchId,
    medicineId: data.medicineId,
    batchNumber: data.batchNumber.trim().toUpperCase(),
    expiryDate: new Date(data.expiryDate),
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
    quantity: data.quantity,
    supplierId: data.supplierId || null,
  });

  await db.insert(schema.stockMovements).values({
    medicineId: data.medicineId,
    batchId: batchId,
    movementType: "PURCHASE",
    quantity: data.quantity,
    balanceAfter: data.quantity,
    notes: `New batch received by ${session.name}`,
    createdBy: session.userId,
  });

  revalidatePath("/inventory");
  revalidatePath("/medicines");
  revalidatePath("/pos");
  return { success: true, batchId };
}

export async function getStockMovements(limit = 25) {
  const db = await getDb();
  return db
    .select({
      id: schema.stockMovements.id,
      medicineName: schema.medicines.brandName,
      batchNumber: schema.medicineBatches.batchNumber,
      movementType: schema.stockMovements.movementType,
      quantity: schema.stockMovements.quantity,
      balanceAfter: schema.stockMovements.balanceAfter,
      notes: schema.stockMovements.notes,
      userName: schema.users.name,
      createdAt: schema.stockMovements.createdAt,
    })
    .from(schema.stockMovements)
    .innerJoin(schema.medicines, eq(schema.stockMovements.medicineId, schema.medicines.id))
    .innerJoin(schema.medicineBatches, eq(schema.stockMovements.batchId, schema.medicineBatches.id))
    .leftJoin(schema.users, eq(schema.stockMovements.createdBy, schema.users.id))
    .orderBy(desc(schema.stockMovements.createdAt))
    .limit(limit);
}
