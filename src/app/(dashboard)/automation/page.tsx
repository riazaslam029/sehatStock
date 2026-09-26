import { getRestockWorkflows } from "@/lib/ai/automation";
import { getSuppliersList } from "@/lib/actions/suppliers";
import { getSession } from "@/lib/auth/session";
import { AutomationView } from "@/components/ai/automation-view";
import { Badge } from "@/components/ui/badge";
import { Cpu, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const [workflows, suppliers, session] = await Promise.all([
    getRestockWorkflows(),
    getSuppliersList(),
    getSession(),
  ]);

  const userRole = session?.role || "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Restock Workflow Automation</h1>
            <Badge variant="primary" className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Academic Feature #3
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            End-to-end multi-step restock automation with 30-day velocity forecasting and Human-in-the-Loop Owner verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1 text-[11px] py-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Human-in-the-Loop Active
          </Badge>
        </div>
      </div>

      <AutomationView
        initialWorkflows={workflows}
        suppliers={suppliers}
        userRole={userRole}
      />
    </div>
  );
}
