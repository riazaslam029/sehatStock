"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface MedicineFormData {
  brandName: string;
  genericName: string;
  categoryId: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  barcode?: string;
  basePurchasePrice: string;
  baseSellingPrice: string;
  reorderLevel: number;
  description?: string;
  symptoms?: string;
}

export async function getMedicinesList(options?: {
  search?: string;
  categoryId?: string;
}) {
  const db = await getDb();
  const query = db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      categoryId: schema.medicines.categoryId,
      categoryName: schema.categories.name,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      manufacturer: schema.medicines.manufacturer,
      barcode: schema.medicines.barcode,
      basePurchasePrice: schema.medicines.basePurchasePrice,
      baseSellingPrice: schema.medicines.baseSellingPrice,
      reorderLevel: schema.medicines.reorderLevel,
      description: schema.medicines.description,
      symptoms: schema.medicines.symptoms,
      status: schema.medicines.status,
      createdAt: schema.medicines.createdAt,
    })
    .from(schema.medicines)
    .innerJoin(schema.categories, eq(schema.medicines.categoryId, schema.categories.id))
    .orderBy(asc(schema.medicines.brandName));

  const allMeds = await query;

  // Fetch stock counts per medicine across active batches
  const batches = await db.select().from(schema.medicineBatches);

  const stockMap: Record<string, number> = {};
  batches.forEach((b: any) => {
    stockMap[b.medicineId] = (stockMap[b.medicineId] || 0) + b.quantity;
  });

  let result = allMeds.map((m: any) => ({
    ...m,
    totalStock: stockMap[m.id] || 0,
    isLowStock: (stockMap[m.id] || 0) <= m.reorderLevel,
  }));

  if (options?.search && options.search.trim().length > 0) {
    const s = options.search.toLowerCase();
    result = result.filter(
      (m: any) =>
        m.brandName.toLowerCase().includes(s) ||
        m.genericName.toLowerCase().includes(s) ||
        (m.barcode && m.barcode.includes(s)) ||
        (m.symptoms && m.symptoms.toLowerCase().includes(s))
    );
  }

  if (options?.categoryId && options.categoryId !== "ALL") {
    result = result.filter((m: any) => m.categoryId === options.categoryId);
  }

  return result;
}

export async function getCategories() {
  const db = await getDb();
  return db.select().from(schema.categories).orderBy(asc(schema.categories.name));
}

export async function createMedicine(data: MedicineFormData) {
  await requireOwner();
  const db = await getDb();

  const newId = `med-${Date.now()}`;
  await db.insert(schema.medicines).values({
    id: newId,
    brandName: data.brandName.trim(),
    genericName: data.genericName.trim(),
    categoryId: data.categoryId,
    strength: data.strength.trim(),
    dosageForm: data.dosageForm.trim(),
    manufacturer: data.manufacturer.trim(),
    barcode: data.barcode?.trim() || null,
    basePurchasePrice: data.basePurchasePrice,
    baseSellingPrice: data.baseSellingPrice,
    reorderLevel: data.reorderLevel || 20,
    description: data.description?.trim() || null,
    symptoms: data.symptoms?.trim() || null,
  });

  revalidatePath("/medicines");
  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true, id: newId };
}
