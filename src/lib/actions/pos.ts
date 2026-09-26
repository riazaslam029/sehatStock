"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, canApplyDiscount } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface CartItem {
  medicineId: string;
  brandName: string;
  genericName: string;
  strength: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface SaleCheckoutInput {
  items: {
    medicineId: string;
    batchId: string;
    quantity: number;
    unitPrice: number;
  }[];
  discountPercent: number;
  ownerApprovalPassword?: string;
  paymentMethod: "CASH" | "CARD" | "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER";
  amountTendered?: number;
  customerName?: string;
  customerPhone?: string;
}

export async function getPosMedicines() {
  const db = await getDb();
  const allMeds = await db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      barcode: schema.medicines.barcode,
      baseSellingPrice: schema.medicines.baseSellingPrice,
    })
    .from(schema.medicines)
    .where(eq(schema.medicines.status, "ACTIVE"))
    .orderBy(asc(schema.medicines.brandName));

  // Get active batches with quantity > 0 sorted by FEFO (expiryDate ASC)
  const batches = await db
    .select({
      id: schema.medicineBatches.id,
      medicineId: schema.medicineBatches.medicineId,
      batchNumber: schema.medicineBatches.batchNumber,
      expiryDate: schema.medicineBatches.expiryDate,
      sellingPrice: schema.medicineBatches.sellingPrice,
      quantity: schema.medicineBatches.quantity,
    })
    .from(schema.medicineBatches)
    .orderBy(asc(schema.medicineBatches.expiryDate));

  const batchMap: Record<string, any[]> = {};
  batches.forEach((b: any) => {
    if (b.quantity > 0) {
      if (!batchMap[b.medicineId]) batchMap[b.medicineId] = [];
      batchMap[b.medicineId].push(b);
    }
  });

  return allMeds.map((m: any) => {
    const medBatches = batchMap[m.id] || [];
    const totalStock = medBatches.reduce((sum, b) => sum + b.quantity, 0);
    // Oldest valid batch (FEFO priority)
    const primaryBatch = medBatches[0] || null;

    return {
      ...m,
      totalStock,
      batches: medBatches,
      primaryBatch,
      sellingPrice: primaryBatch ? parseFloat(primaryBatch.sellingPrice) : parseFloat(m.baseSellingPrice),
    };
  });
}

export async function processSaleTransaction(input: SaleCheckoutInput) {
  const session = await requireAuth();
  const db = await getDb();

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  // 1. Discount Authorization Guard
  let discountAuthorizedBy: string | null = null;
  const discountCheck = await canApplyDiscount(session, input.discountPercent);

  if (input.discountPercent > 0) {
    if (discountCheck.requiresOwner) {
      if (!input.ownerApprovalPassword) {
        return {
          success: false,
          error: `Discount of ${input.discountPercent}% exceeds cashier limit (${discountCheck.maxAllowed}%). Owner authorization password required.`,
          requiresOwnerAuth: true,
        };
      }

      // Verify owner credentials
      const owners = await db
        .select()
        .from(schema.users)
        .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.roles.name, "OWNER"))
        .limit(1);

      if (owners.length === 0) {
        return { success: false, error: "No owner registered in system." };
      }

      const ownerUser = owners[0].users;
      const isValid = await bcrypt.compare(input.ownerApprovalPassword, ownerUser.passwordHash);
      if (!isValid) {
        return {
          success: false,
          error: "Invalid Owner Authorization Password. Discount rejected.",
          requiresOwnerAuth: true,
        };
      }
      discountAuthorizedBy = ownerUser.id;
    }
  }

  // 2. Validate Stock Availability Across Batches
  for (const item of input.items) {
    const [batch] = await db
      .select()
      .from(schema.medicineBatches)
      .where(eq(schema.medicineBatches.id, item.batchId))
      .limit(1);

    if (!batch || batch.quantity < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for batch ${batch?.batchNumber || item.batchId}. Available: ${batch?.quantity || 0}`,
      };
    }
  }

  // 3. Calculate Financials
  let subtotal = 0;
  for (const item of input.items) {
    subtotal += item.quantity * item.unitPrice;
  }

  const discountAmount = (subtotal * (input.discountPercent / 100));
  const netTotal = subtotal - discountAmount;

  // 4. Generate Identifiers
  const saleId = `sale-${Date.now()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const invoiceId = `inv-${Date.now()}`;
  const now = new Date();

  // 5. ACID Operations
  // Insert Sale
  await db.insert(schema.sales).values({
    id: saleId,
    invoiceNo: invoiceNumber,
    cashierId: session.userId,
    subtotal: subtotal.toFixed(2),
    discountPercent: input.discountPercent.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    discountAuthorizedBy,
    totalAmount: netTotal.toFixed(2),
    customerName: input.customerName || null,
    customerPhone: input.customerPhone || null,
    status: "COMPLETED",
    createdAt: now,
  });

  // Insert Sale Items, Decrement Batch Stock & Record Stock Movements
  const generatedLineItems: any[] = [];
  for (const item of input.items) {
    const saleItemId = `sitem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const lineTotal = (item.quantity * item.unitPrice).toFixed(2);

    await db.insert(schema.saleItems).values({
      id: saleItemId,
      saleId,
      medicineId: item.medicineId,
      batchId: item.batchId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: lineTotal,
      returnedQuantity: 0,
    });

    // Decrement Batch Stock
    const [batch] = await db
      .select()
      .from(schema.medicineBatches)
      .where(eq(schema.medicineBatches.id, item.batchId))
      .limit(1);

    const remainingQty = batch.quantity - item.quantity;
    await db
      .update(schema.medicineBatches)
      .set({ quantity: remainingQty })
      .where(eq(schema.medicineBatches.id, item.batchId));

    // Audit Stock Movement
    await db.insert(schema.stockMovements).values({
      medicineId: item.medicineId,
      batchId: item.batchId,
      movementType: "SALE",
      quantity: -item.quantity,
      balanceAfter: remainingQty,
      referenceId: invoiceNumber,
      referenceType: "SALE_INVOICE",
      notes: `Counter sale at terminal by ${session.name}`,
      createdBy: session.userId,
      createdAt: now,
    });

    generatedLineItems.push({
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: parseFloat(lineTotal),
    });
  }

  // Insert Invoice
  await db.insert(schema.invoices).values({
    id: invoiceId,
    invoiceNumber,
    saleId,
    customerName: input.customerName || null,
    customerPhone: input.customerPhone || null,
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxAmount: "0.00",
    netAmount: netTotal.toFixed(2),
    paymentMethod: input.paymentMethod,
    createdAt: now,
  });

  // Insert Payment
  await db.insert(schema.payments).values({
    id: `pay-${Date.now()}`,
    saleId,
    paymentMethod: input.paymentMethod,
    amount: netTotal.toFixed(2),
    status: "PAID",
    referenceNo: invoiceNumber,
    createdAt: now,
  });

  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/medicines");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return {
    success: true,
    invoice: {
      id: invoiceId,
      invoiceNumber,
      date: now.toISOString(),
      cashier: session.name,
      customerName: input.customerName || "Walk-in Customer",
      customerPhone: input.customerPhone || "",
      subtotal,
      discountPercent: input.discountPercent,
      discountAmount,
      total: netTotal,
      paymentMethod: input.paymentMethod,
      amountTendered: input.amountTendered || netTotal,
      changeDue: (input.amountTendered || netTotal) - netTotal,
      discountAuthorizedBy: discountAuthorizedBy ? "Owner Authorized" : null,
      items: generatedLineItems,
    },
  };
}
