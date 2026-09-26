import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Reports & Analytics</h1>
          <p className="text-xs text-text-muted mt-1">Financial performance, profit margins, and fast-moving medicine reports.</p>
        </div>
        <Badge variant="primary">Owner Analytics</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Analytics Engine</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Visual charts for sales trends, daily revenue, margin breakdowns, and supplier performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
