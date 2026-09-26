"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import { createPurchaseAction, PurchaseItemInput } from "@/lib/actions/purchases";
import { PackagePlus, Plus, Search, Trash2, CheckCircle2 } from "lucide-react";

interface PurchaseItemView {
  id: string;
  referenceNo: string;
  supplierName: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  creatorName: string | null;
  createdAt: Date | string;
}

interface PurchaseViewProps {
  purchases: PurchaseItemView[];
  suppliers: { id: string; companyName: string }[];
  medicines: { id: string; brandName: string; strength: string; basePurchasePrice: string }[];
  canEdit: boolean;
}

export function PurchaseView({
  purchases,
  suppliers,
  medicines,
  canEdit,
}: PurchaseViewProps) {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState(suppliers[0]?.id || "");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<PurchaseItemInput[]>([
    {
      medicineId: medicines[0]?.id || "",
      batchNumber: "",
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
      quantity: 100,
      unitPrice: medicines[0]?.basePurchasePrice || "10.00",
    },
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = purchases.filter(
    (p) =>
      p.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = () => {
    const med = medicines[0];
    setItems([
      ...items,
      {
        medicineId: med?.id || "",
        batchNumber: "",
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
        quantity: 50,
        unitPrice: med?.basePurchasePrice || "10.00",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalCalculated = items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (parseFloat(it.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const it of items) {
      if (!it.batchNumber.trim()) {
        setError("Batch numbers are required for all inward medicines.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    const res = await createPurchaseAction({
      supplierId,
      notes,
      items,
    });

    setIsLoading(false);
    if (res.success) {
      setIsOpen(false);
      window.location.reload();
    } else {
      setError("Failed to create purchase order.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search PO reference or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Inward Purchase Order
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Reference #</TableHead>
              <TableHead>Supplier / Distributor</TableHead>
              <TableHead>Order Total</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                  No inward purchase records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-bold text-text">
                    {p.referenceNo}
                  </TableCell>
                  <TableCell className="font-semibold text-text">{p.supplierName}</TableCell>
                  <TableCell className="font-bold text-sm text-text">
                    {formatPKR(parseFloat(p.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Stock Inward & Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">{p.creatorName || "Owner"}</TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {formatDate(p.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inward Purchase Dialog */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Inward Medicine Purchase"
        description="Creates batch records, sets expiry dates, and automatically increments inventory."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-danger-subtle text-xs text-danger">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Select Supplier / Distributor *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Inward Batch Line Items
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleAddItem}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Another Medicine
              </Button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-surface-muted border border-border space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text">Line Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-6 w-6 text-danger hover:bg-danger-subtle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">Medicine *</label>
                    <select
                      value={item.medicineId}
                      onChange={(e) => {
                        const med = medicines.find((m) => m.id === e.target.value);
                        const updated = [...items];
                        updated[idx].medicineId = e.target.value;
                        if (med) updated[idx].unitPrice = med.basePurchasePrice;
                        setItems(updated);
                      }}
                      className="flex h-9 w-full rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brandName} ({m.strength})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">Batch Number *</label>
                    <Input
                      required
                      placeholder="e.g. BTH-2026-A"
                      value={item.batchNumber}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].batchNumber = e.target.value;
                        setItems(updated);
                      }}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">Expiry Date *</label>
                    <Input
                      type="date"
                      required
                      value={item.expiryDate}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].expiryDate = e.target.value;
                        setItems(updated);
                      }}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-text-muted mb-1">Quantity *</label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={item.quantity.toString()}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setItems(updated);
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-muted mb-1">Unit Cost (PKR) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].unitPrice = e.target.value;
                          setItems(updated);
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-primary-subtle border border-primary/20 text-xs">
            <span className="font-semibold text-text">Total Inward Purchase Order Value:</span>
            <span className="text-base font-bold text-primary">{formatPKR(totalCalculated)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Delivery Reference Notes</label>
            <Input
              placeholder="e.g. Delivery Challan # 4819, Invoice Attached"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<PackagePlus className="h-4 w-4" />}>
              Receive & Update Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
