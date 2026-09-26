"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function getInvoicesList() {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.invoices.id,
      invoiceNumber: schema.invoices.invoiceNumber,
      saleId: schema.invoices.saleId,
      customerName: schema.invoices.customerName,
      customerPhone: schema.invoices.customerPhone,
      subtotal: schema.invoices.subtotal,
      discountAmount: schema.invoices.discountAmount,
      taxAmount: schema.invoices.taxAmount,
      netAmount: schema.invoices.netAmount,
      paymentMethod: schema.invoices.paymentMethod,
      createdAt: schema.invoices.createdAt,
      cashierName: schema.users.name,
      saleStatus: schema.sales.status,
    })
    .from(schema.invoices)
    .innerJoin(schema.sales, eq(schema.invoices.saleId, schema.sales.id))
    .leftJoin(schema.users, eq(schema.sales.cashierId, schema.users.id))
    .orderBy(desc(schema.invoices.createdAt));

  return rows;
}

export async function getInvoiceDetails(invoiceId: string) {
  const db = await getDb();

  const [inv] = await db
    .select({
      id: schema.invoices.id,
      invoiceNumber: schema.invoices.invoiceNumber,
      saleId: schema.invoices.saleId,
      customerName: schema.invoices.customerName,
      customerPhone: schema.invoices.customerPhone,
      subtotal: schema.invoices.subtotal,
      discountAmount: schema.invoices.discountAmount,
      taxAmount: schema.invoices.taxAmount,
      netAmount: schema.invoices.netAmount,
      paymentMethod: schema.invoices.paymentMethod,
      createdAt: schema.invoices.createdAt,
      cashierName: schema.users.name,
      saleStatus: schema.sales.status,
    })
    .from(schema.invoices)
    .innerJoin(schema.sales, eq(schema.invoices.saleId, schema.sales.id))
    .leftJoin(schema.users, eq(schema.sales.cashierId, schema.users.id))
    .where(eq(schema.invoices.id, invoiceId))
    .limit(1);

  if (!inv) return null;

  const items = await db
    .select({
      id: schema.saleItems.id,
      medicineId: schema.saleItems.medicineId,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      batchNumber: schema.medicineBatches.batchNumber,
      quantity: schema.saleItems.quantity,
      unitPrice: schema.saleItems.unitPrice,
      totalPrice: schema.saleItems.totalPrice,
      returnedQuantity: schema.saleItems.returnedQuantity,
    })
    .from(schema.saleItems)
    .innerJoin(schema.medicines, eq(schema.saleItems.medicineId, schema.medicines.id))
    .innerJoin(schema.medicineBatches, eq(schema.saleItems.batchId, schema.medicineBatches.id))
    .where(eq(schema.saleItems.saleId, inv.saleId));

  return {
    ...inv,
    items,
  };
}
