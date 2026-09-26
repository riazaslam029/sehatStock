import { getInvoicesList } from "@/lib/actions/invoices";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const invoices = await getInvoicesList();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Counter Sales Ledger
            </h1>
            <Badge variant="primary">Audit Records</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Complete transaction records with cashier authentication, discount authorization, and printable customer receipts.
          </p>
        </div>
      </div>

      <InvoicesView invoices={invoices} />
    </div>
  );
}
