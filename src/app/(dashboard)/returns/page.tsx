import { getReturnsHistory } from "@/lib/actions/returns";
import { ReturnsManager } from "@/components/returns/returns-manager";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const history = await getReturnsHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Customer Returns & Stock Adjustments</h1>
          <p className="text-xs text-text-muted mt-1">
            Traceable returns against original invoices with automatic batch stock restoration & audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Module P0</Badge>
          <Badge variant="success">Audit Trail Active</Badge>
        </div>
      </div>

      <ReturnsManager initialHistory={history} />
    </div>
  );
}
