import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pill } from "lucide-react";

export default function MedicinesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Medicine Catalog</h1>
          <p className="text-xs text-text-muted mt-1">Generic salt formulary, brand names, strengths, and categories.</p>
        </div>
        <Badge variant="primary">Inventory Core</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Pill className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Medicine Catalog Module</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Centralized registry of generic formulas, dosages, manufacturers, barcoding, and reorder levels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
