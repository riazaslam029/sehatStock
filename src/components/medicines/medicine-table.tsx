"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/utils";
import { AddMedicineDialog } from "./add-medicine-dialog";
import { Search, Plus, Pill, AlertTriangle, CheckCircle2, Eye, Filter } from "lucide-react";
import Link from "next/link";

interface MedicineItem {
  id: string;
  brandName: string;
  genericName: string;
  categoryId: string;
  categoryName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  barcode: string | null;
  basePurchasePrice: string;
  baseSellingPrice: string;
  reorderLevel: number;
  totalStock: number;
  isLowStock: boolean;
  symptoms: string | null;
}

interface MedicineTableProps {
  initialMedicines: MedicineItem[];
  categories: { id: string; name: string }[];
  canEdit: boolean;
}

export function MedicineTable({
  initialMedicines,
  categories,
  canEdit,
}: MedicineTableProps) {
  const medicines = initialMedicines;
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const filteredMedicines = React.useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.brandName.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName.toLowerCase().includes(search.toLowerCase()) ||
        (m.barcode && m.barcode.includes(search)) ||
        (m.symptoms && m.symptoms.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        selectedCategory === "ALL" || m.categoryId === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [medicines, search, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <Input
            placeholder="Search brand, generic salt, barcode, or symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Medicine
            </Button>
          )}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand & Generic Salt</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Strength / Form</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Retail Price</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-text-muted">
                  <div className="flex flex-col items-center justify-center">
                    <Pill className="h-8 w-8 text-text-muted/50 mb-2" />
                    <p className="font-semibold text-sm">No medicines found</p>
                    <p className="text-xs">Try adjusting your search or category filter.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text">{m.brandName}</span>
                      <span className="text-xs text-text-muted italic">{m.genericName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-muted font-medium">
                      {m.categoryName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {m.strength}
                      </Badge>
                      <span className="text-xs text-text-muted">{m.dosageForm}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">{m.manufacturer}</TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {formatPKR(parseFloat(m.basePurchasePrice))}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-text">
                    {formatPKR(parseFloat(m.baseSellingPrice))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text">{m.totalStock}</span>
                      {m.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-subtle text-danger border border-danger/20">
                          <AlertTriangle className="h-3 w-3" />
                          Low (≤ {m.reorderLevel})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Healthy
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/inventory?med=${m.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                        Batches
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddMedicineDialog
        categories={categories}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
