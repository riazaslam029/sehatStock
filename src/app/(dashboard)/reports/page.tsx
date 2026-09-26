import { getAnalyticsSummary } from "@/lib/actions/reports";
import { ReportsView } from "@/components/reports/reports-view";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const summary = await getAnalyticsSummary();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Operational & Financial Analytics
            </h1>
            <Badge variant="primary">Owner Analytics</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Real-time revenue realization, product volume rankings, and payment channel distribution.
          </p>
        </div>
      </div>

      <ReportsView summary={summary} />
    </div>
  );
}
