import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Sales History</h1>
          <p className="text-xs text-text-muted mt-1">Audit log of all counter sales transactions.</p>
        </div>
        <Badge variant="primary">Audit Records</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Sales Ledger</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Complete transaction records with cashier ID, discounts, and payment methods.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
