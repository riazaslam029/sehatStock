import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu } from "lucide-react";

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Restock Automation</h1>
            <Badge variant="primary">Mandatory AI Feature #3</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            End-to-end low stock detection, demand analysis, draft PO generation, and owner approval workflow.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Human-in-the-Loop Restock Automation</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Multi-step workflow: DETECTED → ANALYZING → DRAFT_CREATED → PENDING_APPROVAL → APPROVED. AI assists with demand analysis, but purchases require owner signoff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
