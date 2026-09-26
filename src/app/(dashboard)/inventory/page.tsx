import { getInventoryBatches, getInventorySummary, getStockMovements } from "@/lib/actions/inventory";
import { getSession } from "@/lib/auth/session";
import { BatchTable } from "@/components/inventory/batch-table";
import { StatCard } from "@/components/ui/stat-card";
import { formatPKR } from "@/lib/utils";
import { Boxes, DollarSign, PackageCheck, AlertTriangle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: { med?: string };
}) {
  const session = await getSession();
  const [batches, summary, movements] = await Promise.all([
    getInventoryBatches(searchParams?.med),
    getInventorySummary(),
    getStockMovements(40),
  ]);

  const isOwner = session?.role === "OWNER";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Stock & Batch Management
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Real-time batch tracking, First Expiry First Out (FEFO) dispensing order, and audited stock adjustments.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Valuation"
          value={formatPKR(summary.totalValuation)}
          subtitle={`${summary.totalUnits} total units across ${summary.totalSKUs} formulas`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />

        <StatCard
          title="Active Batches"
          value={batches.length}
          subtitle="Monitored for FEFO rotation"
          icon={<PackageCheck className="h-5 w-5" />}
          variant="info"
        />

        <StatCard
          title="Near Expiry (≤30d)"
          value={summary.nearExpiryCount}
          subtitle="Prioritize sale or vendor return"
          trend={{
            value: summary.nearExpiryCount > 0 ? "Requires Attention" : "All Clear",
            isPositive: summary.nearExpiryCount === 0,
          }}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />

        <StatCard
          title="Low Stock Items"
          value={summary.lowStockCount}
          subtitle="Formulas below reorder threshold"
          trend={{
            value: summary.lowStockCount > 0 ? "AI Restock Triggered" : "Stocked",
            isPositive: summary.lowStockCount === 0,
          }}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
      </div>

      {/* Batches Table with FEFO View */}
      <BatchTable
        batches={batches}
        movements={movements}
        canEdit={isOwner}
      />
    </div>
  );
}
