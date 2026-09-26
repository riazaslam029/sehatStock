"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPKR, formatDate } from "@/lib/utils";
import { processSaleTransaction, CartItem } from "@/lib/actions/pos";
import { ReceiptModal, InvoiceReceiptData } from "./receipt-modal";
import {
  ScanBarcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShieldAlert,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface POSMedicine {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  barcode: string | null;
  totalStock: number;
  batches: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    sellingPrice: string;
    quantity: number;
  }[];
  primaryBatch: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    sellingPrice: string;
    quantity: number;
  } | null;
  sellingPrice: number;
}

interface POSTerminalProps {
  medicines: POSMedicine[];
  userRole: "OWNER" | "STAFF";
  userName: string;
}

export function POSTerminal({ medicines, userRole, userName }: POSTerminalProps) {
  const [search, setSearch] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [ownerPassword, setOwnerPassword] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "CASH" | "CARD" | "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER"
  >("CASH");
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [completedInvoice, setCompletedInvoice] = React.useState<InvoiceReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Focus search input on mount
  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filtered search results
  const searchResults = React.useMemo(() => {
    if (!search.trim()) return [];
    const s = search.toLowerCase().trim();
    return medicines
      .filter(
        (m) =>
          m.brandName.toLowerCase().includes(s) ||
          m.genericName.toLowerCase().includes(s) ||
          (m.barcode && m.barcode.includes(s))
      )
      .slice(0, 6);
  }, [medicines, search]);

  // Add medicine to cart (FEFO Default)
  const handleAddToCart = (med: POSMedicine) => {
    if (med.totalStock <= 0 || !med.primaryBatch) {
      setError(`"${med.brandName}" is currently out of stock.`);
      return;
    }

    setError(null);
    const existingIndex = cart.findIndex(
      (item) => item.medicineId === med.id && item.batchId === med.primaryBatch!.id
    );

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= existing.maxStock) {
        setError(`Cannot exceed available batch stock (${existing.maxStock}).`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          brandName: med.brandName,
          genericName: med.genericName,
          strength: med.strength,
          batchId: med.primaryBatch.id,
          batchNumber: med.primaryBatch.batchNumber,
          expiryDate: med.primaryBatch.expiryDate,
          unitPrice: med.sellingPrice,
          quantity: 1,
          maxStock: med.primaryBatch.quantity,
        },
      ]);
    }

    setSearch("");
    searchInputRef.current?.focus();
  };

  // Barcode enter key trigger
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Look for exact barcode match first
      const exactBarcodeMatch = medicines.find(
        (m) => m.barcode && m.barcode === search.trim()
      );
      if (exactBarcodeMatch) {
        handleAddToCart(exactBarcodeMatch);
        return;
      }
      // If one result in dropdown, add it
      if (searchResults.length === 1) {
        handleAddToCart(searchResults[0]);
      }
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.maxStock) {
      setError(`Cannot exceed available batch stock (${item.maxStock}).`);
      return;
    }
    setError(null);
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const netTotal = Math.max(0, subtotal - discountAmount);

  const tenderedVal = parseFloat(amountTendered) || netTotal;
  const changeDue = Math.max(0, tenderedVal - netTotal);

  // Business Rule: Staff can apply up to 3% discount without owner authorization
  const requiresOwnerAuth = userRole === "STAFF" && discountPercent > 3.0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least one medicine to the cart.");
      return;
    }

    if (requiresOwnerAuth && !ownerPassword.trim()) {
      setError("Owner authorization password required for discounts above 3%.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      items: cart.map((it) => ({
        medicineId: it.medicineId,
        batchId: it.batchId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      discountPercent,
      ownerApprovalPassword: requiresOwnerAuth ? ownerPassword : (userRole === "OWNER" ? "demo1234" : undefined),
      paymentMethod,
      amountTendered: paymentMethod === "CASH" ? tenderedVal : netTotal,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    };

    const res = await processSaleTransaction(payload);
    setIsLoading(false);

    if (res.success && res.invoice) {
      // Map invoice payload to receipt view
      const receiptData: InvoiceReceiptData = {
        ...res.invoice,
        items: cart.map((it) => ({
          brandName: it.brandName,
          strength: it.strength,
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.quantity * it.unitPrice,
        })),
      };

      setCompletedInvoice(receiptData);
      setIsReceiptOpen(true);
    } else {
      setError(res.error || "Sale failed.");
    }
  };

  const handleResetPOS = () => {
    setCart([]);
    setDiscountPercent(0);
    setOwnerPassword("");
    setAmountTendered("");
    setCustomerName("");
    setCustomerPhone("");
    setError(null);
    setCompletedInvoice(null);
    setIsReceiptOpen(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Medicine Search & Active Cart (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Search Bar / Barcode Input */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                placeholder="Scan barcode with USB scanner or type brand name (e.g. Panadol)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                leftIcon={<ScanBarcode className="h-5 w-5 text-primary" />}
                className="h-12 text-sm pl-11 bg-surface shadow-subtle font-medium"
              />
            </div>
          </div>

          {/* Instant Dropdown Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-lg border border-border bg-surface shadow-modal overflow-hidden animate-slide-up">
              <div className="p-2 border-b border-border bg-surface-muted/50 text-[11px] font-semibold text-text-muted flex justify-between">
                <span>Select medicine to add (Auto-selects oldest FEFO batch)</span>
                <span>Press Enter to select</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                {searchResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleAddToCart(m)}
                    className="p-3 hover:bg-primary-subtle cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text group-hover:text-primary">
                          {m.brandName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {m.strength}
                        </Badge>
                        <span className="text-xs text-text-muted">{m.dosageForm}</span>
                      </div>
                      <span className="text-xs text-text-muted italic">{m.genericName}</span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-text">
                          {formatPKR(m.sellingPrice)}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          Stock: {m.totalStock} units
                        </span>
                      </div>
                      <Button variant="primary" size="sm" className="h-8 text-xs">
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-lg bg-danger-subtle border border-danger/20 text-xs text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cart Table */}
        <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
          <div className="p-3.5 border-b border-border bg-surface-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-text">
                Current Sale Items ({cart.length})
              </h3>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-danger hover:bg-danger-subtle h-7"
                onClick={() => setCart([])}
              >
                Clear Cart
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item & Strength</TableHead>
                <TableHead>Batch (FEFO)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-32">Quantity</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
                <TableHead className="w-10 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-text-muted/40 mb-2" />
                      <p className="font-semibold text-sm">Cart is currently empty</p>
                      <p className="text-xs">Scan a barcode or type in the search bar above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item, index) => (
                  <TableRow key={`${item.medicineId}-${item.batchId}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-text">{item.brandName}</span>
                        <span className="text-xs text-text-muted">
                          {item.genericName} • {item.strength}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-text">
                          {item.batchNumber}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          Exp: {formatDate(item.expiryDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-text">
                      {formatPKR(item.unitPrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          min="1"
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(index, parseInt(e.target.value) || 1)
                          }
                          className="w-12 h-7 rounded border border-border text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-text">
                      {formatPKR(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:bg-danger-subtle"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Column: Checkout Summary & Payment Controls (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-5">
          <h3 className="font-bold text-base text-text border-b border-border pb-3">
            Sale Summary & Checkout
          </h3>

          {/* Customer Inputs (Optional) */}
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-text">Customer Information</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Discount Section with Owner Authorization Rule */}
          <div className="space-y-2 text-xs pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text">Discount Percentage</label>
              <span className="text-[11px] text-text-muted">
                Staff Limit: <span className="font-bold text-primary">3%</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent === 0 ? "" : discountPercent.toString()}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-text-muted">%</span>
              </div>

              {/* Quick % Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={discountPercent === 3 ? "primary" : "outline"}
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setDiscountPercent(3)}
                >
                  3%
                </Button>
                <Button
                  type="button"
                  variant={discountPercent === 5 ? "primary" : "outline"}
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setDiscountPercent(5)}
                >
                  5%
                </Button>
                <Button
                  type="button"
                  variant={discountPercent === 10 ? "primary" : "outline"}
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setDiscountPercent(10)}
                >
                  10%
                </Button>
              </div>
            </div>

            {/* Discount Authorization Trigger */}
            {requiresOwnerAuth && (
              <div className="p-3 rounded-lg bg-warning-subtle border border-warning/30 space-y-2 mt-2">
                <div className="flex items-center gap-1.5 font-bold text-warning text-xs">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Owner Authorization Required (&gt; 3%)</span>
                </div>
                <p className="text-[11px] text-text-muted">
                  You are logged in as Cashier ({userName}). To apply a {discountPercent}% discount, enter the Owner authorization password:
                </p>
                <Input
                  type="password"
                  placeholder="Owner Password (e.g. demo1234)"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="h-8 text-xs bg-surface"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 text-xs pt-2 border-t border-border">
            <label className="font-semibold text-text">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "CARD", label: "Debit/Credit", icon: CreditCard },
                { id: "EASYPAISA", label: "Easypaisa", icon: Smartphone },
                { id: "JAZZCASH", label: "JazzCash", icon: Smartphone },
                { id: "BANK_TRANSFER", label: "Bank", icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        m.id as
                          | "CASH"
                          | "CARD"
                          | "EASYPAISA"
                          | "JAZZCASH"
                          | "BANK_TRANSFER"
                      )
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-subtle"
                        : "border-border bg-surface text-text-muted hover:bg-surface-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered & Change Due */}
          {paymentMethod === "CASH" && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-medium text-text-muted mb-1">Cash Received</label>
                <Input
                  type="number"
                  placeholder={netTotal.toFixed(0)}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-text-muted mb-1">Change Due</label>
                <div className="h-9 rounded-md border border-border bg-surface-muted px-3 flex items-center font-bold text-xs text-success">
                  {formatPKR(changeDue)}
                </div>
              </div>
            </div>
          )}

          {/* Financial Totals Display */}
          <div className="space-y-1.5 pt-3 border-t border-border text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal:</span>
              <span>{formatPKR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-danger font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span>-{formatPKR(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold text-text pt-2 border-t border-border">
              <span>Total Payable:</span>
              <span className="text-primary">{formatPKR(netTotal)}</span>
            </div>
          </div>

          {/* Complete Sale Button */}
          <Button
            type="button"
            variant="primary"
            className="w-full h-12 text-sm font-bold shadow-md"
            disabled={cart.length === 0 || isLoading}
            isLoading={isLoading}
            onClick={handleCheckout}
            leftIcon={<CheckCircle2 className="h-5 w-5" />}
          >
            Complete Sale & Generate Invoice (F9)
          </Button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        invoice={completedInvoice}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onNextSale={handleResetPOS}
      />
    </div>
  );
}
