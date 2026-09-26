"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { sql, desc, eq } from "drizzle-orm";


export interface AnalyticsSummary {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalDiscounts: number;
  totalInvoices: number;
  averageBasketValue: number;
  paymentMethods: Array<{ name: string; amount: number; count: number }>;
  categorySales: Array<{ name: string; unitsSold: number; revenue: number }>;
  topMedicines: Array<{ name: string; generic: string; unitsSold: number; revenue: number }>;
  recentDailySales: Array<{ date: string; revenue: number; count: number }>;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = await getDb();

  // 1. Invoices Aggregates
  const invoices = await db
    .select({
      id: schema.invoices.id,
      subtotal: schema.invoices.subtotal,
      discountAmount: schema.invoices.discountAmount,
      netAmount: schema.invoices.netAmount,
      paymentMethod: schema.invoices.paymentMethod,
      createdAt: schema.invoices.createdAt,
    })
    .from(schema.invoices)
    .orderBy(desc(schema.invoices.createdAt));

  let totalGross = 0;
  let totalNet = 0;
  let totalDiscounts = 0;
  const paymentMap: Record<string, { amount: number; count: number }> = {};
  const dayMap: Record<string, { revenue: number; count: number }> = {};

  (invoices as any[]).forEach((inv: any) => {

    const net = parseFloat(inv.netAmount);
    const gross = parseFloat(inv.subtotal);
    const disc = parseFloat(inv.discountAmount);

    totalGross += gross;
    totalNet += net;
    totalDiscounts += disc;

    // Payment methods
    if (!paymentMap[inv.paymentMethod]) {
      paymentMap[inv.paymentMethod] = { amount: 0, count: 0 };
    }
    paymentMap[inv.paymentMethod].amount += net;
    paymentMap[inv.paymentMethod].count += 1;

    // Daily buckets (last 7 days)
    const dayKey = new Date(inv.createdAt).toISOString().slice(5, 10); // MM-DD
    if (!dayMap[dayKey]) {
      dayMap[dayKey] = { revenue: 0, count: 0 };
    }
    dayMap[dayKey].revenue += net;
    dayMap[dayKey].count += 1;
  });

  // 2. Top Dispensed Medicines
  const topMeds = await db
    .select({
      name: schema.medicines.brandName,
      generic: schema.medicines.genericName,
      unitsSold: sql<number>`SUM(${schema.saleItems.quantity})::int`,
      revenue: sql<string>`SUM(${schema.saleItems.totalPrice})::numeric(12,2)`,
    })
    .from(schema.saleItems)
    .innerJoin(schema.medicines, eq(schema.saleItems.medicineId, schema.medicines.id))
    .groupBy(schema.saleItems.medicineId, schema.medicines.brandName, schema.medicines.genericName)
    .orderBy(desc(sql`SUM(${schema.saleItems.quantity})`))
    .limit(8);

  // 3. Category Sales Breakdown
  const catSales = await db
    .select({
      name: schema.categories.name,
      unitsSold: sql<number>`SUM(${schema.saleItems.quantity})::int`,
      revenue: sql<string>`SUM(${schema.saleItems.totalPrice})::numeric(12,2)`,
    })
    .from(schema.saleItems)
    .innerJoin(schema.medicines, eq(schema.saleItems.medicineId, schema.medicines.id))
    .innerJoin(schema.categories, eq(schema.medicines.categoryId, schema.categories.id))
    .groupBy(schema.categories.id, schema.categories.name)
    .orderBy(desc(sql`SUM(${schema.saleItems.totalPrice})`));

  return {
    totalGrossRevenue: totalGross,
    totalNetRevenue: totalNet,
    totalDiscounts,
    totalInvoices: invoices.length,
    averageBasketValue: invoices.length > 0 ? totalNet / invoices.length : 0,
    paymentMethods: Object.entries(paymentMap).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    })),
    categorySales: catSales.map((c: any) => ({
      name: c.name,
      unitsSold: c.unitsSold,
      revenue: parseFloat(c.revenue),
    })),
    topMedicines: topMeds.map((m: any) => ({
      name: m.name,
      generic: m.generic,
      unitsSold: m.unitsSold,
      revenue: parseFloat(m.revenue),
    })),
    recentDailySales: Object.entries(dayMap).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    })),
  };
}
