"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getGeminiClient, isGeminiConfigured } from "./gemini";
import {
  getLowStockMedicinesTool,
  getExpiringBatchesTool,
  getSalesReportTool,
  getTopSellingMedicinesTool,
  getInventoryValuationTool,
  lookupMedicineDetailsTool,
} from "./chatbot-tools";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    toolName: string;
    description: string;
    args: Record<string, any>;
    resultSummary: string;
    data?: any;
  }>;
  source?: "GEMINI_TOOL_CALLING" | "DATABASE_TOOL_CALLING";
}

export async function askPharmacyAssistant(
  prompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<ChatMessage> {
  const cleanPrompt = (prompt || "").trim();
  const msgId = `msg-${Date.now()}`;
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!cleanPrompt) {
    return {
      id: msgId,
      role: "assistant",
      content: "Please provide a question regarding your pharmacy operations, inventory, sales, or medicine batches.",
      timestamp: now,
    };
  }

  // 1. Try Gemini Tool-Calling if configured
  if (isGeminiConfigured()) {
    try {
      const client = getGeminiClient();
      if (client) {
        const model = client.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: `You are the lead AI Pharmacy Operations Assistant for SehatStock, an enterprise pharmacy management and Point of Sale (POS) system.
You have access to live database tools to query real PostgreSQL inventory, sales, batches, and valuations.
Always use the tools when answering questions about stock, sales, revenue, expiration, or medicine details.
Provide concise, professional answers formatted with markdown bullet points, bold numbers, and currency in PKR.`,
        });

        // Parse tool calling from user intent
        const toolExecution = await routeAndExecuteTool(cleanPrompt);
        if (toolExecution) {
          const priorContext = history.length > 0
            ? `Recent chat context:\n${history.slice(-3).map((h) => `${h.role}: ${h.content.slice(0, 100)}`).join("\n")}\n\n`
            : "";

          const synthesisPrompt = `${priorContext}The pharmacy staff/owner asked: "${cleanPrompt}"
The system executed the database tool "${toolExecution.toolName}" and retrieved this live PostgreSQL data:
${JSON.stringify(toolExecution.data)}

Please summarize the answer clearly and professionally for the pharmacy staff. Include actionable insights (e.g. recommend restock if low, recommend discounts or returns for expiring batches). Use PKR currency.`;


          const response = await model.generateContent(synthesisPrompt);
          const reply = response.response.text();

          return {
            id: msgId,
            role: "assistant",
            content: reply,
            timestamp: now,
            toolCalls: [
              {
                toolName: toolExecution.toolName,
                description: toolExecution.description,
                args: toolExecution.args,
                resultSummary: toolExecution.summary,
                data: toolExecution.data,
              },
            ],
            source: "GEMINI_TOOL_CALLING",
          };
        }
      }
    } catch (err) {
      console.warn("Gemini Tool Calling error, seamlessly falling back to deterministic database tool handler:", err);
    }
  }

  // 2. Deterministic Database Tool Handler & Analytical Generator (Offline / Zero-Setup / Robust)
  const toolExecution = await routeAndExecuteTool(cleanPrompt);

  if (toolExecution) {
    const formattedReply = generateAnalyticalSummary(cleanPrompt, toolExecution.toolName, toolExecution.data);

    return {
      id: msgId,
      role: "assistant",
      content: formattedReply,
      timestamp: now,
      toolCalls: [
        {
          toolName: toolExecution.toolName,
          description: toolExecution.description,
          args: toolExecution.args,
          resultSummary: toolExecution.summary,
          data: toolExecution.data,
        },
      ],
      source: "DATABASE_TOOL_CALLING",
    };
  }

  // Generic helpful response if no specific tool query matched
  return {
    id: msgId,
    role: "assistant",
    content: `I am your **SehatStock AI Operations Assistant**. I can query our live database directly for you. Here are some of the things you can ask me:

- 📉 **"Which medicines are low on stock and need reordering?"**
- ⏳ **"Show me batches expiring in the next 90 days."**
- 💰 **"What are today's sales and revenue numbers?"**
- 🏆 **"Which medicines are our top sellers?"**
- 📊 **"Calculate our total inventory valuation and profit margins."**
- 🔍 **"Lookup batch details for Panadol 500 or Augmentin 625."**`,
    timestamp: now,
    source: "DATABASE_TOOL_CALLING",
  };
}

/**
 * Intelligent Intent Router: Matches query intent and executes real PostgreSQL backend functions
 */
async function routeAndExecuteTool(prompt: string): Promise<{
  toolName: string;
  description: string;
  args: Record<string, any>;
  data: any;
  summary: string;
} | null> {
  const p = prompt.toLowerCase();

  // 1. Low stock / reorder
  if (p.includes("low stock") || p.includes("reorder") || p.includes("shortage") || p.includes("run out") || p.includes("out of stock")) {
    const res = await getLowStockMedicinesTool();
    return { ...res, args: {} };
  }

  // 2. Expiry / batches
  if (p.includes("expir") || p.includes("shelf life") || (p.includes("batch") && p.includes("near"))) {
    let days = 90;
    if (p.includes("30 days")) days = 30;
    if (p.includes("60 days")) days = 60;
    if (p.includes("180 days") || p.includes("6 month")) days = 180;
    const res = await getExpiringBatchesTool(days);
    return { ...res, args: { days } };
  }

  // 3. Sales / Revenue / Invoices
  if (p.includes("sale") || p.includes("revenue") || p.includes("income") || p.includes("invoice") || p.includes("earning")) {
    let period: "today" | "week" | "month" | "all" = "today";
    if (p.includes("week")) period = "week";
    if (p.includes("month")) period = "month";
    if (p.includes("all") || p.includes("total")) period = "all";
    const res = await getSalesReportTool(period);
    return { ...res, args: { period } };
  }

  // 4. Top selling medicines
  if (p.includes("top sell") || p.includes("best sell") || p.includes("most sold") || p.includes("popular")) {
    const res = await getTopSellingMedicinesTool(5);
    return { ...res, args: { limit: 5 } };
  }

  // 5. Inventory Valuation
  if (p.includes("valuation") || p.includes("worth") || p.includes("asset") || (p.includes("inventory") && p.includes("cost"))) {
    const res = await getInventoryValuationTool();
    return { ...res, args: {} };
  }

  // 6. Medicine Specific Lookup (Panadol, Augmentin, Risek, Brufen, Softin, Disprin, Flagyl, etc.)
  const knownKeywords = ["panadol", "augmentin", "risek", "brufen", "softin", "disprin", "flagyl", "arinac", "cac", "gaviscon", "paracetamol", "amoxicillin", "omeprazole", "ibuprofen"];
  for (const kw of knownKeywords) {
    if (p.includes(kw)) {
      const res = await lookupMedicineDetailsTool(kw);
      return { ...res, args: { term: kw } };
    }
  }

  // If prompt asks "details for X" or "lookup X"
  const lookupMatch = p.match(/(?:details|lookup|check|info|search)\s+(?:for\s+)?([a-z0-9\-]+)/i);
  if (lookupMatch && lookupMatch[1] && lookupMatch[1].length > 2) {
    const res = await lookupMedicineDetailsTool(lookupMatch[1]);
    return { ...res, args: { term: lookupMatch[1] } };
  }

  return null;
}

/**
 * Analytical Generator: Builds rich, data-grounded markdown response from real tool output
 */
function generateAnalyticalSummary(query: string, toolName: string, data: any): string {
  switch (toolName) {
    case "getLowStockMedicines": {
      if (!Array.isArray(data) || data.length === 0) {
        return "✅ **Good news!** All medicines in your catalog currently have adequate stock levels above their configured reorder thresholds.";
      }
      const list = data
        .map(
          (m: any) =>
            `- **${m.brandName} (${m.strength})** — Total Stock: **${m.totalStock} units** (Reorder Threshold: ${m.reorderLevel})`
        )
        .join("\n");
      return `⚠️ **Low Stock Alert:** Found **${data.length} medicine(s)** currently at or below their reorder threshold:\n\n${list}\n\n💡 **Action Recommended:** Navigate to **AI Restock Automation** to automatically generate supplier purchase order drafts.`;
    }

    case "getExpiringBatches": {
      if (!Array.isArray(data) || data.length === 0) {
        return "✅ **No immediate expiration risks found!** No active batches are expiring within the selected timeframe.";
      }
      const list = data
        .map((b: any) => {
          const status = b.isExpired
            ? "🔴 **EXPIRED**"
            : `⏳ **${b.daysRemaining} days remaining**`;
          return `- **${b.medicineName} (${b.strength})** | Batch: \`${b.batchNumber}\` | Quantity: **${b.quantity} units** | Expiry: ${new Date(b.expiryDate).toLocaleDateString()} (${status})`;
        })
        .join("\n");
      return `📅 **Expiring Batches (FEFO Traceability):** Found **${data.length} batch(es)** requiring attention:\n\n${list}\n\n💡 **Action Recommended:** Apply First-Expired, First-Out (FEFO) dispensing at the POS counter or initiate vendor returns.`;
    }

    case "getSalesReport": {
      return `📊 **Sales Performance Summary (${data.period.toUpperCase()}):**\n\n` +
        `- **Total Transactions:** **${data.invoiceCount} invoices**\n` +
        `- **Gross Invoiced:** PKR **${data.totalGross}**\n` +
        `- **Discounts Granted:** PKR **${data.totalDiscounts}**\n` +
        `- **Net Revenue Collected:** **PKR ${data.totalNetRevenue}**\n` +
        `- **Average Basket Value:** PKR **${data.averageBasketSize}**\n\n` +
        `💳 **Payment Methods Breakdown:**\n` +
        Object.entries(data.paymentBreakdown || {})
          .map(([method, amount]: [string, any]) => `- **${method}:** PKR ${Number(amount).toFixed(2)}`)
          .join("\n");
    }

    case "getTopSellingMedicines": {
      if (!Array.isArray(data) || data.length === 0) {
        return "ℹ️ No sales transactions recorded yet. Dispense medicines via POS to view top-selling rankings.";
      }
      const list = data
        .map(
          (m: any, idx: number) =>
            `${idx + 1}. **${m.medicineName}** (${m.genericName}) — **${m.totalUnitsSold} units sold** | Total Revenue: **PKR ${parseFloat(m.totalRevenue).toFixed(2)}**`
        )
        .join("\n");
      return `🏆 **Top Dispensed Medicines by Volume:**\n\n${list}`;
    }

    case "getInventoryValuation": {
      return `💼 **Comprehensive Inventory Asset Valuation:**\n\n` +
        `- **Total Unreserved Stock Units:** **${data.totalUnitsInStock} units** across **${data.activeBatchesCount} active batches**\n` +
        `- **Total Cost Valuation (Purchase Price):** **PKR ${data.costValuation}**\n` +
        `- **Total Retail Valuation (Selling Price):** **PKR ${data.retailValuation}**\n` +
        `- **Projected Gross Margin:** **PKR ${data.projectedGrossProfit}** (**${data.grossMarginPercentage}% margin**)\n\n` +
        `💡 *Calculated using real-time batch-level inventory records.*`;
    }

    case "lookupMedicineDetails": {
      if (!Array.isArray(data) || data.length === 0) {
        return `🔍 No medicines found matching your search term in the active formulary.`;
      }
      return data
        .map((m: any) => {
          const batchInfo = m.batches && m.batches.length > 0
            ? m.batches.map((b: any) => `  - Batch \`${b.batchNumber}\`: **${b.quantity} units** (Exp: ${new Date(b.expiryDate).toLocaleDateString()}, Supplier: ${b.supplierName || "N/A"})`).join("\n")
            : "  - *No active stock batches found.*";

          return `💊 **${m.brandName} ${m.strength}** (${m.dosageForm})\n` +
            `- **Generic Salt:** ${m.genericName}\n` +
            `- **Manufacturer:** ${m.manufacturer}\n` +
            `- **Total Available Stock:** **${m.totalStock} units** ${m.isLowStock ? "⚠️ *(Low Stock)*" : "✅ *(Adequate)*"}\n` +
            `- **Retail Price:** PKR **${parseFloat(m.baseSellingPrice).toFixed(2)}**\n` +
            `- **Active FEFO Batches:**\n${batchInfo}`;
        })
        .join("\n\n---\n\n");
    }

    default:
      return `Processed query against database successfully.`;
  }
}
