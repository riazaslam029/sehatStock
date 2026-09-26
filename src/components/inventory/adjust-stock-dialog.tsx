"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStockAction, BatchItem } from "@/lib/actions/inventory";
import { SlidersHorizontal } from "lucide-react";

interface AdjustStockDialogProps {
  batch: BatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustStockDialog({
  batch,
  isOpen,
  onClose,
  onSuccess,
}: AdjustStockDialogProps) {
  const [adjustmentQty, setAdjustmentQty] = React.useState<number>(0);
  const [movementType, setMovementType] = React.useState<
    "PURCHASE" | "ADJUSTMENT" | "EXPIRED" | "DAMAGE"
  >("ADJUSTMENT");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAdjustmentQty(0);
    setNotes("");
    setError(null);
  }, [batch]);

  if (!batch) return null;

  const resultingStock = batch.quantity + adjustmentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentQty === 0) {
      setError("Please specify a non-zero adjustment quantity.");
      return;
    }
    if (resultingStock < 0) {
      setError("Resulting stock quantity cannot be negative.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await adjustStockAction({
      batchId: batch.id,
      adjustmentQty,
      movementType,
      notes,
    });

    setIsLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Adjustment failed.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Batch Stock Level"
      description={`Medicine: ${batch.medicineName} (${batch.strength}) — Batch ${batch.batchNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded bg-danger-subtle border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-surface-muted p-3 border border-border flex justify-between items-center text-xs">
          <div>
            <span className="text-text-muted">Current Stock:</span>
            <span className="font-bold text-text ml-1.5">{batch.quantity} units</span>
          </div>
          <div>
            <span className="text-text-muted">Resulting Stock:</span>
            <span className={`font-bold ml-1.5 ${resultingStock < 0 ? "text-danger" : "text-primary"}`}>
              {resultingStock} units
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Adjustment Quantity (Positive to Add, Negative to Deduct) *
          </label>
          <Input
            type="number"
            required
            placeholder="e.g. +20 or -5"
            value={adjustmentQty === 0 ? "" : adjustmentQty.toString()}
            onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Movement Reason *
          </label>
          <select
            value={movementType}
            onChange={(e) =>
              setMovementType(
                e.target.value as "PURCHASE" | "ADJUSTMENT" | "EXPIRED" | "DAMAGE"
              )
            }
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="ADJUSTMENT">Stock Reconciliation / Count Correction</option>
            <option value="PURCHASE">Direct Physical Delivery</option>
            <option value="EXPIRED">Dispose Expired Stock</option>
            <option value="DAMAGE">Damaged / Broken Vials</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Audit Reason & Notes
          </label>
          <Input
            placeholder="e.g. Physical inventory count verified on Shelf B4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Confirm Stock Change
          </Button>
        </div>
      </form>
    </Modal>
  );
}
