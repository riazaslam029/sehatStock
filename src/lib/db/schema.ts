import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ==========================================================================
   1. AUTHENTICATION & ACCESS CONTROL
   ========================================================================== */
export const roles = pgTable("roles", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 32 }).notNull().unique(), // 'OWNER', 'STAFF'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: varchar("role_id", { length: 36 }).references(() => roles.id).notNull(),
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(), // 'ACTIVE', 'INACTIVE'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   2. CATEGORIES & MEDICINES REGISTRY
   ========================================================================== */
export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 128 }).notNull().unique(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  brandName: varchar("brand_name", { length: 128 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }).notNull(), // Salt formula
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id).notNull(),
  strength: varchar("strength", { length: 64 }).notNull(), // e.g. "500mg", "625mg", "20mg"
  dosageForm: varchar("dosage_form", { length: 64 }).notNull(), // Tablet, Syrup, Capsule, etc.
  manufacturer: varchar("manufacturer", { length: 128 }).notNull(),
  barcode: varchar("barcode", { length: 64 }).unique(),
  basePurchasePrice: numeric("base_purchase_price", { precision: 12, scale: 2 }).notNull(),
  baseSellingPrice: numeric("base_selling_price", { precision: 12, scale: 2 }).notNull(),
  reorderLevel: integer("reorder_level").default(20).notNull(),
  description: text("description"),
  symptoms: text("symptoms"), // Semicolon-delimited symptoms for clinical search
  embedding: text("embedding"), // 768-dim float JSON string for vector similarity
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    brandIdx: index("med_brand_idx").on(table.brandName),
    genericIdx: index("med_generic_idx").on(table.genericName),
    barcodeIdx: index("med_barcode_idx").on(table.barcode),
  };
});

/* ==========================================================================
   3. BATCHES & FEFO ROTATION
   ========================================================================== */
export const medicineBatches = pgTable("medicine_batches", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  batchNumber: varchar("batch_number", { length: 64 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(), // Vital for FEFO sorting
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(), // Active unreserved stock
  supplierId: varchar("supplier_id", { length: 36 }).references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    medBatchIdx: index("batch_med_idx").on(table.medicineId),
    expiryIdx: index("batch_expiry_idx").on(table.expiryDate),
  };
});

/* ==========================================================================
   4. SUPPLIERS & PROCUREMENT
   ========================================================================== */
export const suppliers = pgTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyName: varchar("company_name", { length: 128 }).notNull().unique(),
  contactPerson: varchar("contact_person", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  ntn: varchar("ntn", { length: 64 }),
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierMedicines = pgTable("supplier_medicines", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: varchar("supplier_id", { length: 36 }).references(() => suppliers.id).notNull(),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  agreedPrice: numeric("agreed_price", { precision: 12, scale: 2 }).notNull(),
  leadTimeDays: integer("lead_time_days").default(2).notNull(),
});

export const purchases = pgTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  referenceNo: varchar("reference_no", { length: 64 }).notNull().unique(),
  supplierId: varchar("supplier_id", { length: 36 }).references(() => suppliers.id).notNull(),
  status: varchar("status", { length: 32 }).default("PENDING").notNull(), // 'PENDING', 'RECEIVED', 'CANCELLED'
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseId: varchar("purchase_id", { length: 36 }).references(() => purchases.id).notNull(),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  batchNumber: varchar("batch_number", { length: 64 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

/* ==========================================================================
   5. SALES & INVOICES
   ========================================================================== */
export const sales = pgTable("sales", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNo: varchar("invoice_no", { length: 64 }).notNull().unique(),
  cashierId: varchar("cashier_id", { length: 36 }).references(() => users.id).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0.00").notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discountAuthorizedBy: varchar("discount_authorized_by", { length: 36 }).references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  customerName: varchar("customer_name", { length: 128 }),
  customerPhone: varchar("customer_phone", { length: 32 }),
  status: varchar("status", { length: 32 }).default("COMPLETED").notNull(), // 'COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).references(() => sales.id).notNull(),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  batchId: varchar("batch_id", { length: 36 }).references(() => medicineBatches.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  returnedQuantity: integer("returned_quantity").default(0).notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull().unique(),
  saleId: varchar("sale_id", { length: 36 }).references(() => sales.id).notNull(),
  customerName: varchar("customer_name", { length: 128 }),
  customerPhone: varchar("customer_phone", { length: 32 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).references(() => sales.id).notNull(),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(), // 'CASH', 'CARD', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).default("PAID").notNull(),
  referenceNo: varchar("reference_no", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   6. RETURNS & REFUNDS (TRACEABLE WORKFLOW)
   ========================================================================== */
export const returns = pgTable("returns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  returnNumber: varchar("return_number", { length: 64 }).notNull().unique(),
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id).notNull(),
  saleId: varchar("sale_id", { length: 36 }).references(() => sales.id).notNull(),
  processedBy: varchar("processed_by", { length: 36 }).references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }).notNull(),
  refundMethod: varchar("refund_method", { length: 32 }).default("CASH").notNull(),
  status: varchar("status", { length: 32 }).default("COMPLETED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const returnItems = pgTable("return_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  returnId: varchar("return_id", { length: 36 }).references(() => returns.id).notNull(),
  saleItemId: varchar("sale_item_id", { length: 36 }).references(() => saleItems.id).notNull(),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  batchId: varchar("batch_id", { length: 36 }).references(() => medicineBatches.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitRefundPrice: numeric("unit_refund_price", { precision: 12, scale: 2 }).notNull(),
  totalRefund: numeric("total_refund", { precision: 12, scale: 2 }).notNull(),
});

/* ==========================================================================
   7. AUDIT LOGS & STOCK MOVEMENTS
   ========================================================================== */
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  batchId: varchar("batch_id", { length: 36 }).references(() => medicineBatches.id).notNull(),
  movementType: varchar("movement_type", { length: 32 }).notNull(), // 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'EXPIRED', 'DAMAGE'
  quantity: integer("quantity").notNull(), // Positive or negative
  balanceAfter: integer("balance_after").notNull(),
  referenceId: varchar("reference_id", { length: 64 }),
  referenceType: varchar("reference_type", { length: 32 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const discountApprovals = pgTable("discount_approvals", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestedBy: varchar("requested_by", { length: 36 }).references(() => users.id).notNull(),
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 32 }).default("PENDING").notNull(), // 'PENDING', 'APPROVED', 'REJECTED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   8. AI RESTOCK AUTOMATION WORKFLOW
   ========================================================================== */
export const restockAutomations = pgTable("restock_automations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  medicineId: varchar("medicine_id", { length: 36 }).references(() => medicines.id).notNull(),
  currentStock: integer("current_stock").notNull(),
  reorderLevel: integer("reorder_level").notNull(),
  salesVelocity30d: integer("sales_velocity_30d").default(0).notNull(),
  recommendedOrderQty: integer("recommended_order_qty").notNull(),
  supplierId: varchar("supplier_id", { length: 36 }).references(() => suppliers.id),
  status: varchar("status", { length: 32 }).default("DETECTED").notNull(),
  // Lifecycle: 'DETECTED', 'ANALYZING', 'DRAFT_CREATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED'
  reasoning: text("reasoning"),
  draftPurchaseId: varchar("draft_purchase_id", { length: 36 }).references(() => purchases.id),
  reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   9. STORE SETTINGS
   ========================================================================== */
export const settings = pgTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ==========================================================================
   RELATIONSHIPS
   ========================================================================== */
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  category: one(categories, { fields: [medicines.categoryId], references: [categories.id] }),
  batches: many(medicineBatches),
  stockMovements: many(stockMovements),
  automations: many(restockAutomations),
}));

export const medicineBatchesRelations = relations(medicineBatches, ({ one }) => ({
  medicine: one(medicines, { fields: [medicineBatches.medicineId], references: [medicines.id] }),
  supplier: one(suppliers, { fields: [medicineBatches.supplierId], references: [suppliers.id] }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(users, { fields: [sales.cashierId], references: [users.id] }),
  authorizer: one(users, { fields: [sales.discountAuthorizedBy], references: [users.id] }),
  items: many(saleItems),
  invoice: one(invoices, { fields: [sales.id], references: [invoices.saleId] }),
  payments: many(payments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  medicine: one(medicines, { fields: [saleItems.medicineId], references: [medicines.id] }),
  batch: one(medicineBatches, { fields: [saleItems.batchId], references: [medicineBatches.id] }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  invoice: one(invoices, { fields: [returns.invoiceId], references: [invoices.id] }),
  sale: one(sales, { fields: [returns.saleId], references: [sales.id] }),
  processor: one(users, { fields: [returns.processedBy], references: [users.id] }),
  items: many(returnItems),
}));
