"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface SupplierFormData {
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn?: string;
}

export async function getSuppliersList() {
  const db = await getDb();
  return db.select().from(schema.suppliers).orderBy(asc(schema.suppliers.companyName));
}

export async function createSupplierAction(data: SupplierFormData) {
  await requireOwner();
  const db = await getDb();

  const id = `sup-${Date.now()}`;
  await db.insert(schema.suppliers).values({
    id,
    companyName: data.companyName.trim(),
    contactPerson: data.contactPerson?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    address: data.address?.trim() || null,
    ntn: data.ntn?.trim() || null,
    status: "ACTIVE",
  });

  revalidatePath("/suppliers");
  revalidatePath("/purchases");
  return { success: true, id };
}
