import { getPurchasesList } from "@/lib/actions/purchases";
import { getSuppliersList } from "@/lib/actions/suppliers";
import { getMedicinesList } from "@/lib/actions/medicines";
import { getSession } from "@/lib/auth/session";
import { PurchaseView } from "@/components/purchases/purchase-view";
import { PackagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await getSession();
  const [purchases, suppliers, medicines] = await Promise.all([
    getPurchasesList(),
    getSuppliersList(),
    getMedicinesList(),
  ]);

  const isOwner = session?.role === "OWNER";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <PackagePlus className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Purchases & Inward Stock Receiving
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Supplier purchase orders, inward batch receiving, expiry tracking, and automatic inventory balance increases.
          </p>
        </div>
      </div>

      <PurchaseView
        purchases={purchases}
        suppliers={suppliers}
        medicines={medicines}
        canEdit={isOwner}
      />
    </div>
  );
}
