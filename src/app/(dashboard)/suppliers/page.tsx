import { getSuppliersList } from "@/lib/actions/suppliers";
import { getSession } from "@/lib/auth/session";
import { SupplierView } from "@/components/suppliers/supplier-view";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const session = await getSession();
  const suppliers = await getSuppliersList();
  const isOwner = session?.role === "OWNER";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Suppliers & Pharmaceutical Distributors
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Directory of authorized pharmaceutical manufacturers, distribution terms, and NTN registry.
          </p>
        </div>
      </div>

      <SupplierView suppliers={suppliers} canEdit={isOwner} />
    </div>
  );
}
