# SehatStock — University Evaluation & Demo Guide

> **Project Name:** SehatStock — Smart Pharmacy Management & Point-of-Sale (POS) System  
> **Course:** Web Technologies  
> **Architecture:** Next.js 14 App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL (PGlite zero-setup embedded WASM + Neon Cloud support), Google Gemini AI Engine.  
> **Repository:** [https://github.com/riazaslam029/sehatStock](https://github.com/riazaslam029/sehatStock)  
> **Active Branches:** `main` and `development`

---

## 🌟 Executive Summary for Evaluators

**SehatStock is strictly an in-store Pharmacy Counter Management & Point-of-Sale (POS) System.**  
It is **NOT** an online e-commerce medicine shopping cart.

It is designed for physical community and hospital pharmacies in Pakistan where patients visit the counter, walk-in customers buy over-the-counter medicines, and registered pharmacists dispense prescription drugs while maintaining:
1. **FEFO (First-Expired, First-Out) batch rotation** to prevent expired drugs from reaching patients.
2. **Strict Role-Based Access Control (RBAC)** where cashier staff discounts are capped at **3%** (higher discounts require instant owner authorization).
3. **Traceable Customer Returns** linked to original invoices that restore batch inventory with an immutable movement audit trail.
4. **Three Mandatory Academic AI Features**:
   - **AI Feature #1: AI Semantic Medicine Search** (Symptom & clinical intent matching with confidence scores).
   - **AI Feature #2: AI Operational Pharmacy Chatbot** (Real database tool calling querying live PostgreSQL data).
   - **AI Feature #3: AI Restock Workflow Automation** (30-day consumption velocity forecasting, PO draft creation, and Human-in-the-Loop Owner signoff).

---

## 🔑 Demo Credentials & Roles

The system is pre-seeded with two authentic roles. On the login page (`/login`), click the **1-Click Quick Demo Presets** for instant evaluation:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Pharmacy Owner** | `owner@sehatstock.pk` | `admin123` | Full administrative control, purchase order approvals, discount overrides, formulary & supplier editing, financial analytics. |
| **Counter Cashier** | `cashier@sehatstock.pk` | `staff123` | POS terminal sales, customer returns, receipt printing. Discount strictly capped at 3%. Cannot approve restock purchase orders. |

---

## 🧪 7 Step-by-Step Teacher Evaluation Walkthroughs

---

### DEMO 1: Authentication & Role-Based Discount Threshold Guard
**Goal:** Verify server-side authorization and the mandatory discount threshold policy.

1. Navigate to `/login`.
2. Click **"Login as Staff (Cashier)"** (`cashier@sehatstock.pk`).
3. Navigate to **Counter POS** (`/pos` or press `F2`).
4. Add any medicine to the cart (e.g. click **Panadol 500mg**).
5. In the Cart panel, find the **Discount %** field.
6. Enter `2.5%` discount: Notice the discount applies smoothly because it is $\le 3\%$.
7. Now change the discount to `5%` ($> 3\%$ limit):
   - A modal immediately triggers: **"Owner Authorization Required — Cashier Discount Limit Exceeded"**.
   - The cashier cannot complete the sale with $>3\%$ discount without the owner's credentials.
8. Enter Owner password (`admin123`) or switch accounts to `owner@sehatstock.pk`: The discount is authorized and audited in the database!

---

### DEMO 2: Physical Counter POS & Automatic FEFO Batch Selection
**Goal:** Verify barcode-ready point-of-sale and automatic First-Expired, First-Out batch allocation.

1. On the POS terminal (`/pos`):
   - Scan or type barcode `8964000120012` (Panadol) or click **Panadol 500mg** from the fast-grid.
   - Click on the item badge in the cart: inspect the allocated batch.
   - **FEFO Verification:** The system automatically allocates batch `PAN-24A` (earlier expiry date) before touching `PAN-24B` (later expiry date).
2. Choose a payment method:
   - **Cash:** Enter tender amount (e.g., `PKR 500`). The system automatically calculates change due in real-time.
   - **Digital Wallet:** Select **Easypaisa**, **JazzCash**, or **Card**.
3. Click **"Complete Sale & Print Receipt"**:
   - The sale is committed transactionally.
   - An authentic 80mm thermal receipt modal renders with store details, drug license number, batch numbers, tax breakdown, and QR verification.
   - Remaining stock in `medicine_batches` decreases immediately.

---

### DEMO 3: Traceable Customer Returns with Stock Restoration
**Goal:** Verify return processing against original invoices with batch stock restoration and audit logging.

1. Navigate to **Customer Returns** (`/returns` or press `F4`).
2. Click the quick demo button: **`INV-2026-080 (Seeded Return Demo)`** (or enter any invoice number generated in Demo 2).
3. Click **"Lookup Invoice"**:
   - The system retrieves the customer record (Mohammad Usman), cashier details, and original purchased line items (`Augmentin 625mg`, batch `AUG-24B`).
4. Select the return checkbox, specify return quantity (e.g., `1 unit`), select the return reason (e.g., *"Doctor changed prescription / Unopened seal intact"*), and choose refund method (**Cash** or **Store Credit**).
5. Click **"Process Return & Restore Stock"**:
   - Generates official return voucher (e.g. `RET-2026-XXXXX`).
   - Restores the 1 unit back into batch `AUG-24B` in `medicine_batches`.
   - Records an immutable audit log entry in `stock_movements` with `movement_type = 'RETURN'`.
   - Updates original invoice status to `PARTIALLY_REFUNDED`.

---

### DEMO 4: Mandatory AI Feature #1 — AI Semantic Medicine Search
**Goal:** Verify clinical natural-language symptom understanding and vector relevance matching.

1. Navigate to **AI Semantic Search** (`/ai-search` or press `Ctrl + K`).
2. Test any of the 6 teacher quick query buttons:
   - 🤒 *"Patient has high fever, body pain and severe headache"*
     - **Result:** Matches **Panadol 500mg** (Paracetamol) and **Disprin 300mg** with high similarity score ($>90\%$).
     - Displays **Clinical Rationale & Mechanism of Action**: explains antipyretic/analgesic properties.
     - Displays live batch stock count and current price.
   - 🫁 *"Severe bacterial throat infection with difficulty swallowing"*
     - **Result:** Matches **Augmentin 625mg** (Amoxicillin + Clavulanic Acid) with clinical justification for broad-spectrum ENT infections.
   - 🔥 *"Severe acid reflux, heartburn and burning sensation in stomach"*
     - **Result:** Matches **Risek 20mg** (Omeprazole) as a proton pump inhibitor reducing gastric acid secretion.
   - 🤧 *"Continuous sneezing, runny nose and dust allergy"*
     - **Result:** Matches **Softin 10mg** (Loratadine) as a non-drowsy 24h antihistamine.
3. Click **"Sell at POS"**: Directly opens the matched medicine in the POS checkout terminal!

---

### DEMO 5: Mandatory AI Feature #2 — AI Operational Pharmacy Chatbot
**Goal:** Verify that the chatbot is not just a generic conversational UI, but actually executes live controlled database queries against PostgreSQL tables.

1. Navigate to **AI Pharmacy Assistant** (`/ai-assistant`).
2. Click any of the teacher evaluation suggested prompt pills:
   - 📉 *"Which medicines are low on stock and need reordering?"*
     - **Tool Call Indicator:** `🔧 Database Tool: getLowStockMedicines()`.
     - Click the tool indicator to inspect the real JSON payload returned from PostgreSQL!
     - Identifies low stock medicines (e.g. Panadol 500mg with 12 units remaining vs 50 reorder level).
   - ⏳ *"Show me all batches expiring within the next 90 days."*
     - **Tool Call Indicator:** `🔧 Database Tool: getExpiringBatches(days=90)`.
     - Returns batch numbers, expiration dates, days remaining, and affected medicines.
   - 💰 *"What are our total sales, invoices, and revenue numbers today?"*
     - **Tool Call Indicator:** `🔧 Database Tool: getSalesReport(period="today")`.
     - Calculates live net revenue, gross invoiced, discount amounts, and payment breakdown.
   - 🏆 *"Which medicines are our top sellers by sales volume?"*
     - **Tool Call Indicator:** `🔧 Database Tool: getTopSellingMedicines(limit=5)`.
   - 📊 *"Calculate our total inventory valuation at cost and projected retail profit."*
     - **Tool Call Indicator:** `🔧 Database Tool: getInventoryValuation()`.
     - Calculates total asset value across all batches at purchase cost vs selling price.
   - 🔍 *"Give me the stock and batch breakdown for Panadol 500."*
     - **Tool Call Indicator:** `🔧 Database Tool: lookupMedicineDetails(term="panadol")`.
     - Returns individual batch breakdown (`PAN-24A`, `PAN-24B`), expiry dates, and supplier.

---

### DEMO 6: Mandatory AI Feature #3 — AI Restock Workflow Automation
**Goal:** Verify autonomous inventory shortage detection, consumption velocity analysis, and PO draft generation.

1. Navigate to **AI Restock Automation** (`/automation`).
2. Review the **Autonomous Restock Lifecycle State Machine**:
   $$\text{DETECTED} \longrightarrow \text{ANALYZING} \longrightarrow \text{DRAFT\_CREATED} \longrightarrow \text{PENDING\_APPROVAL} \longrightarrow \text{APPROVED}$$
3. Click **"Trigger AI Restock Scan"**:
   - Scans all medicines across `medicines` and `medicine_batches`.
   - Detects medicines below reorder threshold (e.g. **Panadol 500mg**: 12 unreserved units $\le$ 50 threshold).
   - Calculates 30-day consumption velocity by querying `sale_items` joined with `sales`.
   - Calculates recommended order quantity: $\text{orderQty} = \max(\text{reorderLevel} \times 2, \text{leadTime} \times \text{dailyVelocity} + \text{safetyBuffer})$.
   - Generates a **Restock Purchase Order Draft** in `PENDING_APPROVAL` status with AI demand analysis reasoning.

---

### DEMO 7: Human-in-the-Loop Owner Verification & Purchase Order Creation
**Goal:** Verify that AI cannot unilaterally commit financial purchases without Owner authorization.

1. On the **AI Restock Automation** page (`/automation`):
   - Notice the pending draft for **Panadol 500mg**.
   - If logged in as **Staff (Cashier)**: The "Approve" button is guarded with warning: *"Cashier/Staff cannot approve purchases. Owner signoff required."*
2. As **Owner** (`owner@sehatstock.pk`):
   - Review AI reasoning and consumption velocity.
   - Edit the recommended quantity if desired (e.g., `200 units`).
   - Select the supplier (e.g., `GlaxoSmithKline (GSK) Pakistan`).
   - Review the calculated total cost in PKR.
3. Click **"Approve & Generate Purchase Order"**:
   - The workflow state transitions from `PENDING_APPROVAL` $\longrightarrow$ `APPROVED`.
   - A real official Purchase Order is created in the database (`PO-2026-XXXXX`).
   - Click the **"Workflow Audit & Purchase Orders"** tab:
     - Inspect the audit trail record showing PO reference number, approved quantity, approving user, and timestamp.
     - Click **"View in Purchases"** to inspect the purchase record in `/purchases`!

---

## 📊 Additional Modules Overview

- **Financial Analytics & Reports (`/reports`):**
  - Gross vs Net realized revenue KPI stat cards.
  - Sales by therapeutic category distribution.
  - Payment channels mix (Cash, Card, Easypaisa, JazzCash).
  - Top 10 dispensed medicines with 1-click **Export CSV** feature.
- **Formulary Management (`/medicines`):**
  - Complete medicine master catalog with generic salt formulas, dosages, and reorder levels.
  - Category filtering and search.
  - Dialog to register new medicines.
- **Batch Inventory & FEFO (`/inventory`):**
  - Batch number, supplier, expiration date, purchase and selling price.
  - Color-coded expiry alerts: Red (Expired), Amber (Expiring $\le 90$ days), Green (Healthy).
  - Manual stock adjustment dialog with mandatory reason auditing.
- **Suppliers & Purchases (`/suppliers`, `/purchases`):**
  - Registered pharmaceutical distributors (GSK, Abbott, Getz, Searle, Sanofi, Ferozsons).
  - Procurement purchase orders and receiving inward stock.
- **System Settings (`/settings`):**
  - Pharmacy legal credentials (Drug Sale License, FBR NTN).
  - Staff discount threshold configuration (default 3%).
  - Thermal receipt disclaimer customizer.
  - Google Gemini AI engine dual-mode status.

---

## 🛠️ Zero-Setup Local Execution Instructions

To run the project on any computer with zero external database configuration:

```bash
# 1. Clone repository
git clone https://github.com/riazaslam029/sehatStock.git
cd sehatStock

# 2. Install dependencies
npm install

# 3. Seed authentic Pakistani pharmacy formulary & demo test records
npm run db:seed

# 4. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. All features and pre-seeded evaluation records will be ready immediately.
