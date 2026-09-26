import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PackagePlus } from "lucide-react";

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Purchases & Inward Stock</h1>
          <p className="text-xs text-text-muted mt-1">Vendor purchase orders, receiving batches, and inward stock movements.</p>
        </div>
        <Badge variant="primary">Purchase Flow</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <PackagePlus className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Purchases & Receiving</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Generate POs, record received batches with expiry dates, and update inventory valuations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
