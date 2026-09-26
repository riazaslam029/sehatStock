# SehatStock — Smart Pharmacy Management & POS System

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Design_Tokens-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Embedded_PGlite_%2B_Neon-336791?logo=postgresql)](https://github.com/electric-sql/pglite)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3_Features-teal)](https://ai.google.dev/)

> **Academic Note**: This is a production-style university Web Technologies project. It is **NOT** an online customer e-commerce store. It is an internal **in-store physical pharmacy management and Point-of-Sale (POS)** application used by pharmacists, staff, and pharmacy owners inside physical Pakistani pharmacies.

---

## 📖 Evaluation & Demo Guide
For university evaluators, a comprehensive, step-by-step walkthrough covering Demos 1 through 7 is available in:  
👉 **[`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)**

---

## 🌟 The 3 Mandatory AI Features

1. **AI Semantic Medicine Search (`/ai-search`)**:
   - Searches medicine formulary using natural language colloquial complaints, symptoms, and clinical intent (e.g. *"fever with body aches and shivering"*, *"severe throat infection with tonsillitis"*).
   - Powered by Gemini vector embeddings + Clinical Ontology Semantic Ranker.
   - Outputs match confidence score (%), clinical rationale / mechanism of action, live batch stock, and direct 1-click *"Sell at POS"* action.

2. **AI Operational Pharmacy Chatbot (`/ai-assistant`)**:
   - Operational pharmacy copilot connected to the real PostgreSQL database.
   - Executes live controlled database tool calling:
     - `getLowStockMedicines()`
     - `getExpiringBatches(days)`
     - `getSalesReport(period)`
     - `getTopSellingMedicines(limit)`
     - `getInventoryValuation()`
     - `lookupMedicineDetails(term)`
   - Includes collapsible **"Database Tool Execution Trace"** allowing evaluators to view the live JSON payloads returned by PostgreSQL.

3. **AI Restock Workflow Automation (`/automation`)**:
   - Multi-step supply chain state machine:
     $$\text{DETECTED} \longrightarrow \text{ANALYZING} \longrightarrow \text{DRAFT\_CREATED} \longrightarrow \text{PENDING\_APPROVAL} \longrightarrow \text{APPROVED}$$
   - Analyzes recent 30-day consumption velocity (`sale_items` aggregated), calculates lead-time buffers, and auto-generates purchase order drafts.
   - **Human-in-the-Loop Owner Approval Guard**: Cashier/Staff accounts cannot approve purchase orders. Only the verified Pharmacy Owner can sign off, transition the workflow state, and generate official Purchase Orders in `purchases`.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript (Strict Mode)
- **Styling & Design System**: Tailwind CSS with Centralized CSS Variable Tokens (`/src/styles/tokens.css`)
- **Icons**: Lucide React
- **Database**: PostgreSQL (Embedded WASM PGlite in `./data/sehatstock_pg` for zero-setup execution, or Neon Cloud via `DATABASE_URL`)
- **ORM**: Drizzle ORM
- **Authentication**: JWT via `jose` with HTTP-Only Cookies & Role-Based Access Control (`OWNER` vs `STAFF`)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) + High-Dimensional Clinical Ontology Engine

---

## 👥 Demo Credentials & Roles

On the login page (`/login`), click the **1-Click Quick Demo Presets** for instant role switching:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Pharmacy Owner** | `owner@sehatstock.pk` | `admin123` | Full administrative control, purchase order approvals, discount overrides, formulary & supplier editing, financial analytics. |
| **Counter Cashier** | `cashier@sehatstock.pk` | `staff123` | POS terminal sales, customer returns, receipt printing. Discount strictly capped at 3%. Cannot approve restock purchase orders. |

---

## 🚀 Quick Start (Zero-Setup)

```bash
# 1. Clone repository
git clone https://github.com/riazaslam029/sehatStock.git
cd sehatStock

# 2. Install dependencies
npm install

# 3. Seed authentic Pakistani pharmacy formulary & test records
npm run db:seed

# 4. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. All routes, pre-seeded evaluation records (`INV-2026-080`, Panadol 500 batches, Augmentin 625, Risek 20), and AI features will be immediately functional.

---

## 📂 Project Architecture

```
sehatstock/
├── docs/                      # Technical documentation
│   ├── DEMO_GUIDE.md          # 7-Step Teacher Evaluation Walkthrough
│   ├── DESIGN_SYSTEM.md       # Design tokens & centralized CSS variables
│   └── ARCHITECTURE.md        # Relational database schema & system architecture
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page with 1-click Demo Presets
│   │   ├── (dashboard)/       # Authenticated app shell
│   │   │   ├── dashboard/     # Real-time counter telemetry & KPI widgets
│   │   │   ├── pos/           # Point of Sale counter terminal with FEFO
│   │   │   ├── medicines/     # Generic salt & medicine registry
│   │   │   ├── inventory/     # Batch-aware FEFO inventory with expiry alerts
│   │   │   ├── suppliers/     # Pharmaceutical distributors registry
│   │   │   ├── purchases/     # Procurement purchase orders & inward stock
│   │   │   ├── sales/         # Counter sales transaction ledger
│   │   │   ├── returns/       # Traceable invoice returns & stock restoration
│   │   │   ├── invoices/      # Customer invoices & thermal receipts
│   │   │   ├── reports/       # Financial analytics & dispensing intelligence
│   │   │   ├── ai-search/     # AI Semantic Medicine Search [Feature #1]
│   │   │   ├── ai-assistant/  # AI Operational Chatbot with tools [Feature #2]
│   │   │   ├── automation/    # AI Restock Workflow Automation [Feature #3]
│   │   │   └── settings/      # Discount thresholds & branch legal profile
│   ├── components/            # Modular UI, POS, AI, Returns, and Reports components
│   ├── lib/
│   │   ├── ai/                # Gemini client, semantic search, tools, and automation
│   │   ├── actions/           # Server actions for all operational modules
│   │   ├── auth/              # JWT session management & permission guards
│   │   └── db/                # Drizzle schema, PGlite client, and seed dataset
│   └── styles/
│       ├── tokens.css         # Single source of truth CSS tokens
│       └── animations.css     # Micro-interaction keyframes
├── package.json
└── tailwind.config.ts
```
