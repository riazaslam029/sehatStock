# SehatStock — Smart Pharmacy Management & POS System

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Design_Tokens-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3_Features-teal)](https://ai.google.dev/)

> **Academic Note**: This is a production-style university Web Technologies project. It is **NOT** an online customer e-commerce store. It is an internal **in-store pharmacy management and Point-of-Sale (POS)** application used physically by pharmacists, staff, and pharmacy owners.

---

## 🌟 The 3 Mandatory AI Features

1. **AI Semantic Search**:
   - Searches medicine records using natural language clinical meaning (e.g., *"fever and dry cough"*).
   - Powered by Gemini vector embeddings and cosine similarity ranking.
2. **AI Operational Chatbot**:
   - Interactive operational assistant that answers pharmacy queries (e.g., *"Which medicines expire within 30 days?"*).
   - Controlled backend tool execution directly against real PostgreSQL tables.
3. **AI Restock Workflow Automation**:
   - Multi-step business workflow: Low Stock Detection → Velocity Analysis → Draft Purchase Order Generation → Owner Sign-off Queue.
   - Enforces human-in-the-loop owner approval before orders are finalized.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + React
- **Language**: TypeScript
- **Styling & Design System**: Tailwind CSS with CSS Variable Tokens (`/src/styles/tokens.css`)
- **Icons**: Lucide React
- **Database**: PostgreSQL (Neon Cloud / Local)
- **ORM**: Drizzle ORM
- **AI Engine**: Google Gemini API (`text-embedding-004` & `gemini-1.5-flash`)

---

## 🎨 Centralized Design System

Theme tokens are defined in **`src/styles/tokens.css`** and wired into Tailwind classes. Modifying `--primary` globally alters the theme across all buttons, cards, badges, and navigation elements.

Complete specification: **[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)**

---

## 📂 Project Architecture

```
sehatstock/
├── docs/                      # Technical documentation
│   ├── DESIGN_SYSTEM.md       # Design tokens & color system
│   └── ARCHITECTURE.md        # Architecture & database plan
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page with demo role presets
│   │   ├── (dashboard)/       # Authenticated app shell
│   │   │   ├── dashboard/     # Real-time telemetry & KPI widgets
│   │   │   ├── pos/           # Point of Sale terminal
│   │   │   ├── medicines/     # Generic salt & medicine registry
│   │   │   ├── inventory/     # Batch-aware FEFO inventory
│   │   │   ├── suppliers/     # Vendor & distributor registry
│   │   │   ├── purchases/     # Inward purchase orders & receiving
│   │   │   ├── sales/         # Sales transaction ledger
│   │   │   ├── returns/       # Traceable invoice returns & refunds
│   │   │   ├── invoices/      # Customer invoice center
│   │   │   ├── reports/       # Analytical charts & profit metrics
│   │   │   ├── ai-search/     # AI Semantic Search [Feature #1]
│   │   │   ├── ai-assistant/  # AI Operational Chatbot [Feature #2]
│   │   │   ├── automation/    # AI Restock Workflow [Feature #3]
│   │   │   └── settings/      # Discount thresholds & branch configs
│   │   ├── globals.css        # Base global styles
│   │   └── layout.tsx         # Root layout with fonts
│   ├── components/
│   │   ├── ui/                # Base design-system components (Button, Card, Badge, Input, Table, Modal)
│   │   └── layout/            # Sidebar, Topbar, and MobileNav
│   ├── lib/                   # Utilities, constants & formatting
│   └── styles/
│       ├── tokens.css         # Single source of truth CSS tokens
│       └── animations.css     # Micro-interaction keyframes
├── .env.example               # Template environment configuration
├── package.json
└── tailwind.config.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x`

### 2. Installation
```bash
git clone <repo-url>
cd sehatstock
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env.local
```
Add your `DATABASE_URL` and `GEMINI_API_KEY`.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@sehatstock.pk` | `demo1234` | Full access, settings, owner discount approvals, AI PO signoff |
| **Staff / Cashier** | `staff@sehatstock.pk` | `demo1234` | Counter POS, sales, invoice lookup, standard returns (≤3% discount) |
