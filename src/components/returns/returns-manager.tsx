"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  getInvoiceForReturn,
  processReturnTransaction,
  ReturnItemRequest,
  InvoiceForReturn,
  InvoiceReturnItem,
  ReturnHistoryItem,
  ProcessReturnSuccess,
} from "@/lib/actions/returns";
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Boxes,
  History,
} from "lucide-react";

interface ReturnsManagerProps {
  initialHistory: ReturnHistoryItem[];
}

export function ReturnsManager({ initialHistory }: ReturnsManagerProps) {
  const [invoiceQuery, setInvoiceQuery] = React.useState("INV-2026-080");
  const [invoiceData, setInvoiceData] = React.useState<InvoiceForReturn | null>(null);
  const [selectedItems, setSelectedItems] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState("Doctor changed prescription / Unopened seal intact");
  const [refundMethod, setRefundMethod] = React.useState<"CASH" | "STORE_CREDIT">("CASH");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<ProcessReturnSuccess | null>(null);
  const [history, setHistory] = React.useState<ReturnHistoryItem[]>(initialHistory);

  const handleSearch = async (queryToUse?: string) => {
    const q = queryToUse || invoiceQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    setError(null);
    setSuccessData(null);
    setSelectedItems({});

    const data = await getInvoiceForReturn(q);
    setIsSearching(false);

    if (data) {
      setInvoiceData(data);
      // Auto-select first returnable item with quantity 1 for fast cashier flow
      const firstReturnable = data.items.find((i: InvoiceReturnItem) => i.returnableQuantity > 0);
      if (firstReturnable) {
        setSelectedItems({ [firstReturnable.id]: 1 });
      }
    } else {
      setInvoiceData(null);
      setError(`No invoice found matching "${q}". Check the invoice number or generate a sale in POS first.`);
    }
  };

  const handleToggleItem = (itemId: string, maxQty: number) => {
    if (selectedItems[itemId]) {
      const copy = { ...selectedItems };
      delete copy[itemId];
      setSelectedItems(copy);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: Math.min(1, maxQty) });
    }
  };

  const handleQuantityChange = (itemId: string, newQty: number, maxQty: number) => {
    if (newQty <= 0) {
      const copy = { ...selectedItems };
      delete copy[itemId];
      setSelectedItems(copy);
    } else {
      setSelectedItems({
        ...selectedItems,
        [itemId]: Math.min(newQty, maxQty),
      });
    }
  };

  const calculatedRefund = React.useMemo(() => {
    if (!invoiceData) return 0;
    let sum = 0;
    for (const [itemId, qty] of Object.entries(selectedItems)) {
      const item = invoiceData.items.find((i: InvoiceReturnItem) => i.id === itemId);
      if (item) {
        sum += qty * item.unitPriceNum;
      }
    }
    return sum;
  }, [invoiceData, selectedItems]);

  const handleProcessReturn = async () => {
    if (!invoiceData) return;
    const itemsToReturn: ReturnItemRequest[] = [];

    for (const [itemId, qty] of Object.entries(selectedItems)) {
      const item = invoiceData.items.find((i: InvoiceReturnItem) => i.id === itemId);
      if (item && qty > 0) {
        itemsToReturn.push({
          saleItemId: item.id,
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: qty,
          unitRefundPrice: item.unitPriceNum,
        });
      }
    }

    if (itemsToReturn.length === 0) {
      setError("Please select at least one item to return.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const res = await processReturnTransaction({
      invoiceNumber: invoiceData.invoiceNumber,
      items: itemsToReturn,
      reason,
      refundMethod,
    });

    setIsProcessing(false);

    if (res.success && res.returnNumber) {
      setSuccessData({
        success: true,
        returnNumber: res.returnNumber,
        refundAmount: res.refundAmount ?? 0,
        refundMethod: res.refundMethod ?? refundMethod,
        restoredItemsCount: res.restoredItemsCount ?? 0,
      });
      setInvoiceData(null);
      setSelectedItems({});
      // Update local history
      setHistory([
        {
          id: res.returnNumber,
          returnNumber: res.returnNumber,
          invoiceNumber: invoiceData.invoiceNumber,
          customerName: invoiceData.customerName || "Walk-in Customer",
          refundAmount: (res.refundAmount ?? 0).toFixed(2),
          refundMethod: res.refundMethod ?? refundMethod,
          reason,
          status: "COMPLETED",
          processedBy: "Current Staff",
          createdAt: new Date(),
        },
        ...history,
      ]);
    } else {
      setError(res.error || "Failed to process return.");
    }

  };

  return (
    <div className="space-y-6">
      {/* Top Search & Evaluation Presets Bar */}
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <Input
              placeholder="Enter exact invoice # (e.g. INV-2026-080)..."
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-10 text-sm"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSearch()}
              isLoading={isSearching}
            >
              Lookup Invoice
            </Button>
          </div>

          {/* Quick Demo Pre-seeded Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Quick Demo:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInvoiceQuery("INV-2026-080");
                handleSearch("INV-2026-080");
              }}
              className="text-xs h-8 border-primary/30 text-primary bg-primary-subtle"
            >
              INV-2026-080 (Seeded Return Demo)
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-danger-subtle border border-danger/20 text-xs text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData && (
          <div className="p-4 rounded-lg bg-success-subtle border border-success/30 text-xs text-text space-y-1 animate-slide-up">
            <div className="flex items-center gap-2 font-bold text-success text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Customer Return Completed Successfully!</span>
            </div>
            <p className="text-text-muted">
              Return Voucher <span className="font-mono font-bold text-text">{successData.returnNumber}</span> generated.
              Refund amount of <span className="font-bold text-success">{formatPKR(successData.refundAmount)}</span> issued via {successData.refundMethod}.
            </p>
            <p className="text-primary font-semibold flex items-center gap-1.5 pt-1">
              <Boxes className="h-4 w-4" />
              <span>{successData.restoredItemsCount} unit(s) restored to batch inventory with immutable movement log.</span>
            </p>
          </div>
        )}
      </div>

      {/* Invoice Details & Return Item Selector */}
      {invoiceData && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-6 animate-slide-up">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-text">
                  {invoiceData.invoiceNumber}
                </span>
                <Badge variant={invoiceData.saleStatus === "COMPLETED" ? "success" : "warning"}>
                  {invoiceData.saleStatus}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Purchased on {new Date(invoiceData.createdAt).toLocaleDateString()} • Original Cashier: {invoiceData.cashierName}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-text-muted">Customer: </span>
              <span className="font-semibold text-xs text-text">
                {invoiceData.customerName || "Walk-in"} {invoiceData.customerPhone ? `(${invoiceData.customerPhone})` : ""}
              </span>
              <div className="text-xs font-bold text-text">
                Total Invoiced: {formatPKR(parseFloat(invoiceData.netAmount))}
              </div>
            </div>
          </div>

          {/* Purchased Line Items for Return Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Select Medicines to Return
            </span>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Return</TableHead>
                    <TableHead>Medicine & Strength</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Purchased Qty</TableHead>
                    <TableHead>Already Returned</TableHead>
                    <TableHead>Returnable</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="w-32">Return Qty</TableHead>
                    <TableHead className="text-right">Refund Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.items.map((it: InvoiceReturnItem) => {
                    const isSelected = !!selectedItems[it.id];
                    const currentReturnQty = selectedItems[it.id] || 0;
                    const canReturn = it.returnableQuantity > 0;

                    return (
                      <TableRow
                        key={it.id}
                        className={isSelected ? "bg-primary-subtle/40" : ""}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            disabled={!canReturn}
                            checked={isSelected}
                            onChange={() => handleToggleItem(it.id, it.returnableQuantity)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-text">{it.medicineName}</span>
                            <span className="text-[11px] text-text-muted">
                              {it.genericName} • {it.strength}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{it.batchNumber}</TableCell>
                        <TableCell className="text-xs font-medium">{it.quantity}</TableCell>
                        <TableCell className="text-xs text-text-muted">
                          {it.returnedQuantity > 0 ? (
                            <span className="text-danger font-semibold">{it.returnedQuantity}</span>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold text-xs ${
                              canReturn ? "text-primary" : "text-text-muted"
                            }`}
                          >
                            {it.returnableQuantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-text-muted">
                          {formatPKR(it.unitPriceNum)}
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            min="1"
                            max={it.returnableQuantity}
                            disabled={!isSelected}
                            value={isSelected ? currentReturnQty : ""}
                            placeholder="0"
                            onChange={(e) =>
                              handleQuantityChange(
                                it.id,
                                parseInt(e.target.value) || 0,
                                it.returnableQuantity
                              )
                            }
                            className="w-20 h-8 rounded border border-border px-2 text-center text-xs font-bold disabled:bg-surface-muted focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm text-text">
                          {isSelected ? formatPKR(currentReturnQty * it.unitPriceNum) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Reason & Refund Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Return Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="Doctor changed prescription / Unopened seal intact">
                  Doctor changed prescription (Unopened seal intact)
                </option>
                <option value="Wrong medicine or strength dispensed at counter">
                  Wrong medicine or strength dispensed at counter
                </option>
                <option value="Patient experienced adverse reaction / allergy">
                  Patient experienced adverse reaction / allergy
                </option>
                <option value="Packaging damaged prior to consumption">
                  Packaging damaged prior to consumption
                </option>
                <option value="Duplicate purchase by family member">
                  Duplicate purchase by family member
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Refund Issuance Method *
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as "CASH" | "STORE_CREDIT")}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="CASH">Cash Refund at Counter</option>
                <option value="STORE_CREDIT">Store Credit Voucher</option>
              </select>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-surface-muted border border-border">
            <div>
              <span className="text-xs text-text-muted">Total Refund Amount:</span>
              <div className="text-xl font-bold text-primary">
                {formatPKR(calculatedRefund)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setInvoiceData(null)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                disabled={calculatedRefund <= 0 || isProcessing}
                isLoading={isProcessing}
                onClick={handleProcessReturn}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Process Return & Restore Stock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Traceable Returns History Table */}
      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-text">Traceable Returns Ledger</h3>
          </div>
          <span className="text-xs text-text-muted">
            {history.length} processed returns
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return #</TableHead>
              <TableHead>Original Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Return Reason</TableHead>
              <TableHead>Refund Method</TableHead>
              <TableHead>Refund Amount</TableHead>
              <TableHead>Authorized Staff</TableHead>
              <TableHead className="text-right">Processed On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-text-muted text-xs">
                  No returns processed yet.
                </TableCell>
              </TableRow>
            ) : (
              history.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {r.returnNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-text">
                    {r.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-text">{r.customerName}</TableCell>
                  <TableCell className="text-xs text-text-muted max-w-[200px] truncate">
                    {r.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {r.refundMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-danger">
                    -{formatPKR(parseFloat(r.refundAmount))}
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">{r.processedBy}</TableCell>
                  <TableCell className="text-right text-xs text-text-muted">
                    {formatDate(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
