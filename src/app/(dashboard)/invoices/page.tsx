import { getInvoicesList } from "@/lib/actions/invoices";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await getInvoicesList();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Customer Invoices & Billing Center
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Complete transaction records, customer receipts, and discount audit trails.
          </p>
        </div>
      </div>

      <InvoicesView invoices={invoices} />
    </div>
  );
}
