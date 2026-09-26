import { getPosMedicines } from "@/lib/actions/pos";
import { getSession } from "@/lib/auth/session";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const session = await getSession();
  const medicines = await getPosMedicines();

  const userRole = session?.role || "STAFF";
  const userName = session?.name || "Counter Cashier";

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">
              Counter Point of Sale (POS)
            </h1>
            <p className="text-xs text-text-muted">
              Fast counter checkout • Barcode scanner enabled • Automated FEFO batch deduction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Terminal Cashier:</span>
          <span className="font-bold text-text">{userName}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20">
            {userRole}
          </span>
        </div>
      </div>

      <POSTerminal
        medicines={medicines}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
}
