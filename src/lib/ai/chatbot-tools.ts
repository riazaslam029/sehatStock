"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, sql, desc, asc, gte } from "drizzle-orm";


export interface ToolResult<T = any> {
  toolName: string;
  description: string;
  data: T;
  summary: string;
}

/**
 * 1. Get medicines that are at or below their reorder level
 */
export async function getLowStockMedicinesTool(): Promise<ToolResult> {
  const db = await getDb();

  const meds = await db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      reorderLevel: schema.medicines.reorderLevel,
      baseSellingPrice: schema.medicines.baseSellingPrice,
      totalStock: sql<number>`COALESCE(SUM(${schema.medicineBatches.quantity}), 0)::int`,
    })
    .from(schema.medicines)
    .leftJoin(
      schema.medicineBatches,
      eq(schema.medicineBatches.medicineId, schema.medicines.id)
    )
    .where(eq(schema.medicines.status, "ACTIVE"))
    .groupBy(schema.medicines.id);

  const lowStock = meds.filter((m: any) => m.totalStock <= m.reorderLevel);

  return {
    toolName: "getLowStockMedicines",
    description: "Queries active formulary where total unreserved batch stock is <= reorder threshold.",
    data: lowStock,
    summary: `Found ${lowStock.length} medicines at or below reorder level.`,
  };
}

/**
 * 2. Get batches expiring within given number of days
 */
export async function getExpiringBatchesTool(days = 90): Promise<ToolResult> {
  const db = await getDb();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const batches = await db
    .select({
      batchId: schema.medicineBatches.id,
      batchNumber: schema.medicineBatches.batchNumber,
      expiryDate: schema.medicineBatches.expiryDate,
      quantity: schema.medicineBatches.quantity,
      purchasePrice: schema.medicineBatches.purchasePrice,
      sellingPrice: schema.medicineBatches.sellingPrice,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      supplierName: schema.suppliers.companyName,
    })
    .from(schema.medicineBatches)
    .innerJoin(schema.medicines, eq(schema.medicineBatches.medicineId, schema.medicines.id))
    .leftJoin(schema.suppliers, eq(schema.medicineBatches.supplierId, schema.suppliers.id))
    .where(
      sql`${schema.medicineBatches.quantity} > 0 AND ${schema.medicineBatches.expiryDate} <= ${cutoff}`
    )
    .orderBy(asc(schema.medicineBatches.expiryDate));

  const daysDiff = (exp: Date) => Math.ceil((new Date(exp).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const enriched = batches.map((b: any) => ({
    ...b,
    daysRemaining: daysDiff(b.expiryDate),
    isExpired: daysDiff(b.expiryDate) <= 0,
  }));

  return {
    toolName: "getExpiringBatches",
    description: `Queries batches with remaining stock expiring within ${days} days (FEFO critical).`,
    data: enriched,
    summary: `Found ${batches.length} batch(es) expiring within ${days} days.`,
  };
}

/**
 * 3. Query sales figures, revenue, profit, and invoice count
 */
export async function getSalesReportTool(period: "today" | "week" | "month" | "all" = "today"): Promise<ToolResult> {
  const db = await getDb();
  const now = new Date();
  const startDate = new Date();

  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setFullYear(2000, 0, 1);
  }

  const invoices = await db
    .select({
      id: schema.invoices.id,
      invoiceNumber: schema.invoices.invoiceNumber,
      subtotal: schema.invoices.subtotal,
      discountAmount: schema.invoices.discountAmount,
      netAmount: schema.invoices.netAmount,
      paymentMethod: schema.invoices.paymentMethod,
      createdAt: schema.invoices.createdAt,
    })
    .from(schema.invoices)
    .where(gte(schema.invoices.createdAt, startDate))
    .orderBy(desc(schema.invoices.createdAt));

  let totalGross = 0;
  let totalDiscounts = 0;
  let totalNet = 0;
  const paymentBreakdown: Record<string, number> = {};

  invoices.forEach((inv: any) => {
    const net = parseFloat(inv.netAmount);
    totalGross += parseFloat(inv.subtotal);
    totalDiscounts += parseFloat(inv.discountAmount);
    totalNet += net;
    paymentBreakdown[inv.paymentMethod] = (paymentBreakdown[inv.paymentMethod] || 0) + net;
  });

  return {
    toolName: "getSalesReport",
    description: `Calculates revenue, invoices, discounts, and payment methods for period: ${period}.`,
    data: {
      period,
      invoiceCount: invoices.length,
      totalGross: totalGross.toFixed(2),
      totalDiscounts: totalDiscounts.toFixed(2),
      totalNetRevenue: totalNet.toFixed(2),
      averageBasketSize: invoices.length > 0 ? (totalNet / invoices.length).toFixed(2) : "0.00",
      paymentBreakdown,
    },
    summary: `Sales report for ${period}: ${invoices.length} transactions, PKR ${totalNet.toFixed(2)} net revenue.`,
  };
}

/**
 * 4. Top selling medicines by sales volume and revenue
 */
export async function getTopSellingMedicinesTool(limit = 5): Promise<ToolResult> {
  const db = await getDb();

  const items = await db
    .select({
      medicineId: schema.saleItems.medicineId,
      medicineName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      totalUnitsSold: sql<number>`SUM(${schema.saleItems.quantity})::int`,
      totalRevenue: sql<string>`SUM(${schema.saleItems.totalPrice})::numeric(12,2)`,
    })
    .from(schema.saleItems)
    .innerJoin(schema.medicines, eq(schema.saleItems.medicineId, schema.medicines.id))
    .groupBy(schema.saleItems.medicineId, schema.medicines.brandName, schema.medicines.genericName)
    .orderBy(desc(sql`SUM(${schema.saleItems.quantity})`))
    .limit(limit);

  return {
    toolName: "getTopSellingMedicines",
    description: `Aggregates POS line item sales to identify top ${limit} dispensed medicines.`,
    data: items,
    summary: `Retrieved top ${items.length} dispensed medicines.`,
  };
}

/**
 * 5. Calculate total inventory valuation
 */
export async function getInventoryValuationTool(): Promise<ToolResult> {
  const db = await getDb();

  const batches = await db
    .select({
      quantity: schema.medicineBatches.quantity,
      purchasePrice: schema.medicineBatches.purchasePrice,
      sellingPrice: schema.medicineBatches.sellingPrice,
    })
    .from(schema.medicineBatches)
    .where(sql`${schema.medicineBatches.quantity} > 0`);

  let totalUnits = 0;
  let totalCostValuation = 0;
  let totalRetailValuation = 0;

  batches.forEach((b: any) => {
    totalUnits += b.quantity;
    totalCostValuation += b.quantity * parseFloat(b.purchasePrice);
    totalRetailValuation += b.quantity * parseFloat(b.sellingPrice);
  });

  const potentialGrossMargin = totalRetailValuation - totalCostValuation;
  const marginPercent = totalRetailValuation > 0 ? (potentialGrossMargin / totalRetailValuation) * 100 : 0;

  return {
    toolName: "getInventoryValuation",
    description: "Computes total inventory asset value at cost price and projected retail value.",
    data: {
      totalUnitsInStock: totalUnits,
      activeBatchesCount: batches.length,
      costValuation: totalCostValuation.toFixed(2),
      retailValuation: totalRetailValuation.toFixed(2),
      projectedGrossProfit: potentialGrossMargin.toFixed(2),
      grossMarginPercentage: marginPercent.toFixed(1),
    },
    summary: `Total inventory: ${totalUnits} units across ${batches.length} batches valued at PKR ${totalCostValuation.toFixed(2)} (cost) / PKR ${totalRetailValuation.toFixed(2)} (retail).`,
  };
}

/**
 * 6. Lookup medicine details with batches and suppliers
 */
export async function lookupMedicineDetailsTool(nameOrSalt: string): Promise<ToolResult> {
  const db = await getDb();
  const term = (nameOrSalt || "").trim().toLowerCase();

  const meds = await db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      manufacturer: schema.medicines.manufacturer,
      barcode: schema.medicines.barcode,
      baseSellingPrice: schema.medicines.baseSellingPrice,
      reorderLevel: schema.medicines.reorderLevel,
      description: schema.medicines.description,
      symptoms: schema.medicines.symptoms,
    })
    .from(schema.medicines)
    .where(
      sql`LOWER(${schema.medicines.brandName}) LIKE ${`%${term}%`} OR LOWER(${schema.medicines.genericName}) LIKE ${`%${term}%`}`
    )
    .limit(3);

  const enriched = await Promise.all(
    meds.map(async (med: any) => {
      const batches = await db
        .select({
          batchId: schema.medicineBatches.id,
          batchNumber: schema.medicineBatches.batchNumber,
          expiryDate: schema.medicineBatches.expiryDate,
          quantity: schema.medicineBatches.quantity,
          sellingPrice: schema.medicineBatches.sellingPrice,
          supplierName: schema.suppliers.companyName,
        })
        .from(schema.medicineBatches)
        .leftJoin(schema.suppliers, eq(schema.medicineBatches.supplierId, schema.suppliers.id))
        .where(eq(schema.medicineBatches.medicineId, med.id))
        .orderBy(asc(schema.medicineBatches.expiryDate));

      const totalStock = batches.reduce((sum: number, b: any) => sum + b.quantity, 0);

      return {
        ...med,
        totalStock,
        isLowStock: totalStock <= med.reorderLevel,
        batches,
      };
    })
  );

  return {
    toolName: "lookupMedicineDetails",
    description: `Lookup medicine formulary and active FEFO batch breakdown for query "${nameOrSalt}".`,
    data: enriched,
    summary: `Found ${enriched.length} medicine(s) matching "${nameOrSalt}".`,
  };
}
