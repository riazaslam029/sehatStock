import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Customer Invoices</h1>
          <p className="text-xs text-text-muted mt-1">Printable receipts, GST tax breakdowns, and payment reconciliation.</p>
        </div>
        <Badge variant="primary">Billing</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Invoice Center</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Browse counter invoices, review batch details, print thermal or A4 receipts, and view payment splits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
