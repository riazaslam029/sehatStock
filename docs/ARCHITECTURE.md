# SehatStock System Architecture Plan

## 1. High-Level Architecture Overview

SehatStock is an internal physical pharmacy management and Point-of-Sale (POS) system engineered for high speed, reliability, auditability, and intelligent automation.

```
                           +--------------------------------------+
                           |   Pharmacy Staff / Owner Web App     |
                           |  (Next.js App Router + TypeScript)   |
                           +-------------------+------------------+
                                               |
                                     Next.js Server Actions
                                      & Secure API Handlers
                                               |
                  +----------------------------+----------------------------+
                  |                                                         |
         [ Core Business Layer ]                                   [ AI Intelligence Suite ]
    +-------------------------------+                        +------------------------------------+
    | - POS & Transaction Engine    |                        | 1. AI Semantic Search Engine       |
    | - FEFO Batch Inventory Engine |                        |    (Gemini Embeddings + Similarity)|
    | - Traceable Returns Manager   |                        | 2. AI Operational Chatbot          |
    | - Owner Discount Authorization|                        |    (Controlled DB Tools Agent)     |
    | - Inward Purchase Workflow    |                        | 3. AI Restock Workflow Automation  |
    +---------------+---------------+                        |    (Demand Analysis + Owner PO)    |
                    |                                        +-----------------+------------------+
                    |                                                          |
                    +--------------------------+-------------------------------+
                                               |
                                        [ Drizzle ORM ]
                                               |
                                               v
                               +-------------------------------+
                               |     PostgreSQL / Neon DB      |
                               | (Relational Schema + Vectors) |
                               +-------------------------------+
```

---

## 2. Mandatory Academic AI Subsystem Design

### AI Feature #1: Semantic Search
- **Input**: Natural language user search (e.g., *"medicine for persistent fever and severe body pain"* or *"capsule for chronic acidity"*).
- **Processing**: The server calls the Gemini embedding model (`text-embedding-004`) to produce high-dimensional vector representations.
- **Retrieval**: Executes cosine similarity matching against embedded medicine metadata (brand name, salt formula, therapeutic category, symptoms treated, dosage form).
- **Output**: Ranked results with similarity scores, real-time stock levels, and FEFO expiry status.

### AI Feature #2: Operational Pharmacy Chatbot
- **Input**: Staff or owner conversational queries (e.g., *"Which batches expire next month?"*, *"What were our top 3 medicines today by revenue?"*).
- **Architecture**: LLM agent using **Controlled Tool Calling**. The LLM never writes raw SQL.
- **Registered Tools**:
  - `getLowStockMedicines()`
  - `getExpiringBatches(days)`
  - `getSalesReport(dateRange)`
  - `getTopSellingMedicines(period)`
  - `getInventoryValuation()`
  - `getSupplierPurchases(supplierId)`
  - `getReturnsReport(period)`
- **Output**: Accurate, formatted operational answers backed by real database records.

### AI Feature #3: Restock Workflow Automation
- **Multi-step Business Process**:
  1. `DETECTED`: Background trigger detects medicine stock dropping below `reorder_level`.
  2. `ANALYZING`: Evaluates last 30-day velocity, seasonal trends, and supplier lead times.
  3. `DRAFT_CREATED`: Automatically generates a structured Purchase Order draft with calculated optimal order quantity (EOQ) and preferred vendor.
  4. `PENDING_APPROVAL`: Dispatched to Owner's approval queue.
  5. `APPROVED / REJECTED`: Owner signs off or edits quantities.
  6. `COMPLETED`: Converts draft into an active purchase order and notifies supplier.
- **Safety Guarantee**: The AI never commits external funds or purchases automatically. Human-in-the-loop authorization is strictly enforced.

---

## 3. Database Schema Blueprint (PostgreSQL + Drizzle)

The database schema is strictly normalized, maintaining referential integrity across 18 core entities:

1. **`users`**: User identities, hashed credentials, contact information.
2. **`roles`**: `OWNER`, `STAFF` with granular capability definitions.
3. **`categories`**: Antibiotics, Analgesics, Antacids, Antihistamines, Cardiology, etc.
4. **`medicines`**: Generic name (salt), brand name, manufacturer, strength, dosage form, barcode, base price, reorder level, vector embedding.
5. **`medicine_batches`**: Batch number, expiry date (FEFO key), inward unit cost, selling price, current quantity, supplier ID.
6. **`suppliers`**: Pharmaceutical distributors, NTN, contact person, phone, credit terms.
7. **`supplier_medicines`**: Mapping table linking suppliers to medicines with supply terms.
8. **`purchases`**: Inward PO records, supplier reference, total cost, receiving status.
9. **`purchase_items`**: Batches received, purchase unit cost, quantity ordered vs received.
10. **`sales`**: Counter sales transactions, timestamp, cashier ID, subtotal, discount, net total.
11. **`sale_items`**: Line items sold, batch ID deducted, sold price, quantity.
12. **`invoices`**: Customer-facing invoice number, tax amount, printed timestamp.
13. **`payments`**: Payment records (Cash, Card, Easypaisa, JazzCash, Bank Transfer).
14. **`returns`**: Return transaction linked to original sale and invoice.
15. **`return_items`**: Specific batches and quantities returned with formal return reason.
16. **`stock_movements`**: Immutable audit log of every stock alteration (`PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`, `EXPIRED`, `DAMAGE`).
17. **`discount_approvals`**: Audit record when staff applies discounts exceeding standard threshold (>3%).
18. **`restock_automations`**: State machine records for AI purchase order generation (`DETECTED` -> `DRAFT_CREATED` -> `APPROVED`).

---

## 4. POS Transactional Integrity & FEFO Rule

- **FEFO Allocation**: When an item is sold, the POS inventory resolver checks batches sorted by `expiry_date ASC`. The oldest valid batch is automatically prioritized.
- **ACID Transactions**:
  ```ts
  await db.transaction(async (tx) => {
    // 1. Verify stock availability on specific batch
    // 2. Decrement medicine_batches quantity
    // 3. Insert sale record
    // 4. Insert sale_items
    // 5. Insert payment record
    // 6. Insert immutable stock_movements
    // 7. Generate invoice record
  });
  ```
- If any step fails, the entire transaction rolls back cleanly with zero partial corruption.
