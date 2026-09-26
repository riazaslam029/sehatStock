"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface PurchaseItemInput {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: string;
}

export async function getPurchasesList() {
  const db = await getDb();
  const purchases = await db
    .select({
      id: schema.purchases.id,
      referenceNo: schema.purchases.referenceNo,
      supplierName: schema.suppliers.companyName,
      status: schema.purchases.status,
      totalAmount: schema.purchases.totalAmount,
      notes: schema.purchases.notes,
      creatorName: schema.users.name,
      createdAt: schema.purchases.createdAt,
    })
    .from(schema.purchases)
    .innerJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
    .leftJoin(schema.users, eq(schema.purchases.createdBy, schema.users.id))
    .orderBy(desc(schema.purchases.createdAt));

  return purchases;
}

export async function createPurchaseAction(data: {
  supplierId: string;
  referenceNo?: string;
  notes?: string;
  items: PurchaseItemInput[];
}) {
  const session = await requireOwner();
  const db = await getDb();

  const purchaseId = `po-${Date.now()}`;
  const refNo = data.referenceNo || `PO-${Date.now().toString().slice(-6)}`;

  let totalAmount = 0;
  for (const item of data.items) {
    totalAmount += item.quantity * parseFloat(item.unitPrice);
  }

  // 1. Create Purchase record
  await db.insert(schema.purchases).values({
    id: purchaseId,
    referenceNo: refNo,
    supplierId: data.supplierId,
    status: "RECEIVED",
    totalAmount: totalAmount.toFixed(2),
    notes: data.notes || null,
    createdBy: session.userId,
    receivedAt: new Date(),
  });

  // 2. Insert items and create/update batches + stock movements
  for (const item of data.items) {
    const itemId = `pi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const lineTotal = (item.quantity * parseFloat(item.unitPrice)).toFixed(2);

    await db.insert(schema.purchaseItems).values({
      id: itemId,
      purchaseId,
      medicineId: item.medicineId,
      batchNumber: item.batchNumber.trim().toUpperCase(),
      expiryDate: new Date(item.expiryDate),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: lineTotal,
    });

    // Create batch in inventory
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    // Compute a standard selling price margin if not set (default 25% margin)
    const sellingPrice = (parseFloat(item.unitPrice) * 1.25).toFixed(2);

    await db.insert(schema.medicineBatches).values({
      id: batchId,
      medicineId: item.medicineId,
      batchNumber: item.batchNumber.trim().toUpperCase(),
      expiryDate: new Date(item.expiryDate),
      purchasePrice: item.unitPrice,
      sellingPrice,
      quantity: item.quantity,
      supplierId: data.supplierId,
    });

    // Log Stock Movement
    await db.insert(schema.stockMovements).values({
      medicineId: item.medicineId,
      batchId,
      movementType: "PURCHASE",
      quantity: item.quantity,
      balanceAfter: item.quantity,
      referenceId: refNo,
      referenceType: "PURCHASE_ORDER",
      notes: `Inward PO receipt from supplier`,
      createdBy: session.userId,
    });
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/medicines");
  revalidatePath("/dashboard");
  return { success: true, purchaseId, referenceNo: refNo };
}
