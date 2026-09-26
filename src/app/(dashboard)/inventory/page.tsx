import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Boxes } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Stock & Batches</h1>
          <p className="text-xs text-text-muted mt-1">Batch-level stock tracking with FEFO (First Expiry First Out) rotation.</p>
        </div>
        <Badge variant="primary">FEFO Engine</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Boxes className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Batch Inventory Management</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Tracking batch numbers, expiry dates, purchase costs, shelf locations, and auditable stock movement logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
