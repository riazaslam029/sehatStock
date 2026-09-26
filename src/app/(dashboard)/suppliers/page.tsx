import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Suppliers</h1>
          <p className="text-xs text-text-muted mt-1">Pharmaceutical distributors and manufacturer vendor directory.</p>
        </div>
        <Badge variant="primary">Vendor Management</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Truck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Supplier Directory</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Supplier contact directory, supplied medicine catalogs, and order history records.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
