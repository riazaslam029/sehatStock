/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import { getInvoiceDetails } from "@/lib/actions/invoices";
import { ReceiptModal, InvoiceReceiptData } from "@/components/pos/receipt-modal";
import { Search, Eye } from "lucide-react";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  netAmount: string;
  paymentMethod: string;
  createdAt: Date | string;
  cashierName: string | null;
  saleStatus: string;
}

export function InvoicesView({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch] = React.useState("");
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceReceiptData | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customerPhone && inv.customerPhone.includes(search))
  );

  const handleOpenReceipt = async (invId: string) => {
    setLoadingId(invId);
    const details = await getInvoiceDetails(invId);
    setLoadingId(null);
    if (details) {
      const receiptData: InvoiceReceiptData = {
        id: details.id,
        invoiceNumber: details.invoiceNumber,
        date: new Date(details.createdAt).toISOString(),
        cashier: details.cashierName || "Cashier",
        customerName: details.customerName || "Walk-in Customer",
        customerPhone: details.customerPhone || "",
        subtotal: parseFloat(details.subtotal),
        discountPercent: parseFloat(details.subtotal) > 0 ? (parseFloat(details.discountAmount) / parseFloat(details.subtotal)) * 100 : 0,
        discountAmount: parseFloat(details.discountAmount),
        total: parseFloat(details.netAmount),
        paymentMethod: details.paymentMethod,
        amountTendered: parseFloat(details.netAmount),
        changeDue: 0,
        discountAuthorizedBy: null,
        items: details.items.map((it: any) => ({
          medicineName: it.medicineName,
          strength: it.strength,
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          unitPrice: parseFloat(it.unitPrice),
          totalPrice: parseFloat(it.totalPrice),
        })),
      };
      setSelectedInvoice(receiptData);
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search invoice #, customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Net Total</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-text-muted">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-bold text-text">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-text">
                    {inv.customerName || "Walk-in Customer"}
                    {inv.customerPhone && (
                      <span className="block text-[10px] text-text-muted font-mono">
                        {inv.customerPhone}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {inv.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {formatPKR(parseFloat(inv.subtotal))}
                  </TableCell>
                  <TableCell className="text-xs text-danger">
                    {parseFloat(inv.discountAmount) > 0
                      ? `-${formatPKR(parseFloat(inv.discountAmount))}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-bold text-sm text-text">
                    {formatPKR(parseFloat(inv.netAmount))}
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {inv.cashierName || "Staff"}
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {formatDate(inv.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleOpenReceipt(inv.id)}
                      isLoading={loadingId === inv.id}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReceiptModal
        invoice={selectedInvoice}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNextSale={() => setIsOpen(false)}
      />
    </div>
  );
}
