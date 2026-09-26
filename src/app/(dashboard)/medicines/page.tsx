import { getMedicinesList, getCategories } from "@/lib/actions/medicines";
import { getSession } from "@/lib/auth/session";
import { MedicineTable } from "@/components/medicines/medicine-table";
import { Pill } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MedicinesPage() {
  const session = await getSession();
  const [medicines, categories] = await Promise.all([
    getMedicinesList(),
    getCategories(),
  ]);

  const isOwner = session?.role === "OWNER";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Medicines Formulary & Catalog
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Complete database of brands, generic salt formulations, therapeutic classes, and pricing rules.
          </p>
        </div>
      </div>

      <MedicineTable
        initialMedicines={medicines}
        categories={categories}
        canEdit={isOwner}
      />
    </div>
  );
}
