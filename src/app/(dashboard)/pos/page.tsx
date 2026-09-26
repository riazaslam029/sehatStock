import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Point of Sale (POS)</h1>
          <p className="text-xs text-text-muted mt-1">High-speed physical pharmacy checkout terminal.</p>
        </div>
        <Badge variant="primary">Phase 2 Core Module</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Counter POS Ready for Architecture Phase 2</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Barcode scanning, FEFO batch selection, owner discount authorization (above 3%), payment recording, and instant receipt generation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
