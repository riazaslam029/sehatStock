"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { Printer, RotateCcw } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export interface InvoiceReceiptData {
  id: string;
  invoiceNumber: string;
  date: string;
  cashier: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  changeDue: number;
  discountAuthorizedBy: string | null;
  items: {
    brandName?: string;
    medicineName?: string;
    strength?: string;
    batchNumber?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface ReceiptModalProps {
  invoice: InvoiceReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
  onNextSale: () => void;
}

export function ReceiptModal({
  invoice,
  isOpen,
  onClose,
  onNextSale,
}: ReceiptModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Counter Sale Receipt"
      description={`Generated Invoice: ${invoice.invoiceNumber}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="rounded-lg border border-border bg-surface p-5 text-text font-mono text-xs shadow-sm space-y-4 print:border-none print:p-0 print:shadow-none"
        >
          {/* Pharmacy Store Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-border">
            <h2 className="text-base font-bold font-sans tracking-tight text-text">
              {APP_CONFIG.branchName}
            </h2>
            <p className="text-[11px] text-text-muted">
              Shop 14-16, Commercial Ave, Phase 5, DHA, Lahore
            </p>
            <p className="text-[11px] text-text-muted">
              Tel: +92 300 1234567 • NTN: 0711902-3
            </p>
          </div>

          {/* Invoice Telemetry */}
          <div className="grid grid-cols-2 gap-1 text-[11px] pb-2 border-b border-dashed border-border">
            <div>
              <span className="text-text-muted">Invoice: </span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-text-muted">Date: </span>
              <span>{new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Cashier: </span>
              <span>{invoice.cashier}</span>
            </div>
            <div className="text-right">
              <span className="text-text-muted">Payment: </span>
              <span className="font-bold">{invoice.paymentMethod}</span>
            </div>
            {invoice.customerName && (
              <div className="col-span-2">
                <span className="text-text-muted">Customer: </span>
                <span>{invoice.customerName} {invoice.customerPhone ? `(${invoice.customerPhone})` : ""}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-border pb-1 text-text-muted">
                <th className="py-1">Item Description</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1.5">
                    <span className="font-bold text-text">
                      {item.brandName || item.medicineName}
                    </span>
                    {item.strength && <span className="text-text-muted"> ({item.strength})</span>}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1.5 text-right font-semibold">
                    {item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-dashed border-border space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Subtotal:</span>
              <span>{formatPKR(invoice.subtotal)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-danger font-medium">
                <span>
                  Discount ({invoice.discountPercent}%)
                  {invoice.discountAuthorizedBy && ` [${invoice.discountAuthorizedBy}]`}
                  :
                </span>
                <span>-{formatPKR(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border text-text">
              <span>Net Payable:</span>
              <span className="text-primary">{formatPKR(invoice.total)}</span>
            </div>

            {invoice.paymentMethod === "CASH" && (
              <>
                <div className="flex justify-between text-text-muted pt-1">
                  <span>Cash Tendered:</span>
                  <span>{formatPKR(invoice.amountTendered)}</span>
                </div>
                <div className="flex justify-between text-success font-semibold">
                  <span>Change Given:</span>
                  <span>{formatPKR(invoice.changeDue)}</span>
                </div>
              </>
            )}
          </div>

          {/* Receipt Footer */}
          <div className="text-center pt-3 border-t border-dashed border-border text-[10px] text-text-muted space-y-0.5">
            <p className="font-bold text-text">Thank you for your visit!</p>
            <p>Medicines once sold can be returned within 3 days with this invoice.</p>
            <p>SehatStock POS — Software by Dr. Hamza Malik</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Receipt
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onNextSale}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Next Customer (Clear POS)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
