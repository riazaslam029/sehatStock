import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Returns & Refunds</h1>
          <p className="text-xs text-text-muted mt-1">Traceable returns against original invoices with stock restoration.</p>
        </div>
        <Badge variant="primary">Core P0 Module</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <RotateCcw className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Customer Returns & Adjustments</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Search invoice by number, validate return eligibility, select batch, record return reason, and restore stock.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
