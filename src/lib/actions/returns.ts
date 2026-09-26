"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface ReturnItemRequest {
  saleItemId: string;
  medicineId: string;
  batchId: string;
  quantity: number;
  unitRefundPrice: number;
}

export interface ProcessReturnInput {
  invoiceNumber: string;
  items: ReturnItemRequest[];
  reason: string;
  refundMethod: "CASH" | "STORE_CREDIT";
}

export interface InvoiceItemWithReturnable {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  returnedQuantity: number;
  returnableQuantity: number;
  unitPriceNum: number;
}


export async function getInvoiceForReturn(invoiceNumber: string) {
  const db = await getDb();

  const cleanNum = invoiceNumber.trim().toUpperCase();

  const [inv] = await db
    .select({
      id: schema.invoices.id,
      invoiceNumber: schema.invoices.invoiceNumber,
      saleId: schema.invoices.saleId,
      customerName: schema.invoices.customerName,
      customerPhone: schema.invoices.customerPhone,
      subtotal: schema.invoices.subtotal,
      discountAmount: schema.invoices.discountAmount,
      netAmount: schema.invoices.netAmount,
      paymentMethod: schema.invoices.paymentMethod,
      createdAt: schema.invoices.createdAt,
      cashierName: schema.users.name,
      saleStatus: schema.sales.status,
    })
    .from(schema.invoices)
    .innerJoin(schema.sales, eq(schema.invoices.saleId, schema.sales.id))
    .leftJoin(schema.users, eq(schema.sales.cashierId, schema.users.id))
    .where(eq(schema.invoices.invoiceNumber, cleanNum))
    .limit(1);

  if (!inv) return null;

  // Retrieve purchased items with batch info and current returned quantities
  const items = await db
    .select({
      id: schema.saleItems.id,
      medicineId: schema.saleItems.medicineId,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      batchId: schema.saleItems.batchId,
      batchNumber: schema.medicineBatches.batchNumber,
      expiryDate: schema.medicineBatches.expiryDate,
      quantity: schema.saleItems.quantity,
      unitPrice: schema.saleItems.unitPrice,
      totalPrice: schema.saleItems.totalPrice,
      returnedQuantity: schema.saleItems.returnedQuantity,
    })
    .from(schema.saleItems)
    .innerJoin(schema.medicines, eq(schema.saleItems.medicineId, schema.medicines.id))
    .innerJoin(schema.medicineBatches, eq(schema.saleItems.batchId, schema.medicineBatches.id))
    .where(eq(schema.saleItems.saleId, inv.saleId));

  const itemsWithReturnable: InvoiceItemWithReturnable[] = (items as any[]).map((it: any) => {
    const returnable = (it.quantity as number) - (it.returnedQuantity as number);
    return {
      ...it,
      returnableQuantity: Math.max(0, returnable),
      unitPriceNum: parseFloat(it.unitPrice),
    };
  });



  return {
    ...inv,
    items: itemsWithReturnable,
  };
}

export async function processReturnTransaction(input: ProcessReturnInput) {
  const session = await requireAuth();
  const db = await getDb();

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "No items selected for return." };
  }

  if (!input.reason.trim()) {
    return { success: false, error: "A valid return reason is mandatory." };
  }

  // 1. Fetch Invoice & Sale Record
  const invoiceData = await getInvoiceForReturn(input.invoiceNumber);
  if (!invoiceData) {
    return { success: false, error: "Original invoice not found." };
  }

  // 2. Validate returnable quantities strictly
  let totalRefundCalculated = 0;
  for (const retItem of input.items) {
    const originalItem = invoiceData.items.find((i: InvoiceItemWithReturnable) => i.id === retItem.saleItemId);
    if (!originalItem) {
      return { success: false, error: `Invalid item selected for return.` };
    }

    if (retItem.quantity <= 0) {
      return { success: false, error: "Return quantity must be greater than zero." };
    }

    if (retItem.quantity > originalItem.returnableQuantity) {
      return {
        success: false,
        error: `Cannot return ${retItem.quantity} units of "${originalItem.medicineName}". Max returnable: ${originalItem.returnableQuantity}.`,
      };
    }

    totalRefundCalculated += retItem.quantity * retItem.unitRefundPrice;
  }

  // 3. Create Traceable Return Record
  const returnId = `ret-${Date.now()}`;
  const returnNumber = `RET-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  await db.insert(schema.returns).values({
    id: returnId,
    returnNumber,
    invoiceId: invoiceData.id,
    saleId: invoiceData.saleId,
    processedBy: session.userId,
    reason: input.reason.trim(),
    refundAmount: totalRefundCalculated.toFixed(2),
    refundMethod: input.refundMethod,
    status: "COMPLETED",
    createdAt: now,
  });

  // 4. Update Sale Items, Return Items, and Restore Batch Inventory with Audit Movements
  for (const retItem of input.items) {
    const originalItem = invoiceData.items.find((i: InvoiceItemWithReturnable) => i.id === retItem.saleItemId)!;

    const lineRefund = (retItem.quantity * retItem.unitRefundPrice).toFixed(2);

    // Insert return item
    await db.insert(schema.returnItems).values({
      id: `ritem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      returnId,
      saleItemId: retItem.saleItemId,
      medicineId: retItem.medicineId,
      batchId: retItem.batchId,
      quantity: retItem.quantity,
      unitRefundPrice: retItem.unitRefundPrice.toFixed(2),
      totalRefund: lineRefund,
    });

    // Update returned_quantity on original sale item
    const newReturnedQty = originalItem.returnedQuantity + retItem.quantity;
    await db
      .update(schema.saleItems)
      .set({ returnedQuantity: newReturnedQty })
      .where(eq(schema.saleItems.id, retItem.saleItemId));

    // Restore stock to batch in medicine_batches
    const [batch] = await db
      .select()
      .from(schema.medicineBatches)
      .where(eq(schema.medicineBatches.id, retItem.batchId))
      .limit(1);

    const restoredQty = (batch?.quantity || 0) + retItem.quantity;
    await db
      .update(schema.medicineBatches)
      .set({ quantity: restoredQty })
      .where(eq(schema.medicineBatches.id, retItem.batchId));

    // Immutable Stock Movement Audit Log
    await db.insert(schema.stockMovements).values({
      medicineId: retItem.medicineId,
      batchId: retItem.batchId,
      movementType: "RETURN",
      quantity: retItem.quantity, // Positive quantity adds back to stock
      balanceAfter: restoredQty,
      referenceId: returnNumber,
      referenceType: "CUSTOMER_RETURN",
      notes: `Restored stock from invoice ${input.invoiceNumber}: ${input.reason}`,
      createdBy: session.userId,
      createdAt: now,
    });
  }

  // 5. Update overall sale status (REFUNDED or PARTIALLY_REFUNDED)
  const updatedSaleItems = await db
    .select()
    .from(schema.saleItems)
    .where(eq(schema.saleItems.saleId, invoiceData.saleId));

  const allReturned = (updatedSaleItems as any[]).every((it: any) => it.quantity === it.returnedQuantity);
  const newSaleStatus = allReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await db
    .update(schema.sales)
    .set({ status: newSaleStatus })
    .where(eq(schema.sales.id, invoiceData.saleId));

  revalidatePath("/returns");
  revalidatePath("/invoices");
  revalidatePath("/inventory");
  revalidatePath("/medicines");
  revalidatePath("/dashboard");

  return {
    success: true,
    returnNumber,
    refundAmount: totalRefundCalculated,
    refundMethod: input.refundMethod,
    restoredItemsCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export async function getReturnsHistory(limit = 30) {
  const db = await getDb();
  return db
    .select({
      id: schema.returns.id,
      returnNumber: schema.returns.returnNumber,
      invoiceNumber: schema.invoices.invoiceNumber,
      customerName: schema.invoices.customerName,
      refundAmount: schema.returns.refundAmount,
      refundMethod: schema.returns.refundMethod,
      reason: schema.returns.reason,
      status: schema.returns.status,
      processedBy: schema.users.name,
      createdAt: schema.returns.createdAt,
    })
    .from(schema.returns)
    .innerJoin(schema.invoices, eq(schema.returns.invoiceId, schema.invoices.id))
    .leftJoin(schema.users, eq(schema.returns.processedBy, schema.users.id))
    .orderBy(desc(schema.returns.createdAt))
    .limit(limit);
}

export type InvoiceForReturn = NonNullable<Awaited<ReturnType<typeof getInvoiceForReturn>>>;
export type InvoiceReturnItem = InvoiceForReturn["items"][number];
export type ReturnHistoryItem = Awaited<ReturnType<typeof getReturnsHistory>>[number];

export interface ProcessReturnSuccess {
  success: true;
  returnNumber: string;
  refundAmount: number;
  refundMethod: "CASH" | "STORE_CREDIT";
  restoredItemsCount: number;
}


