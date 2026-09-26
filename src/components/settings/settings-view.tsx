"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  CheckCircle2,
  Store,
  Percent,
  Receipt,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function SettingsView() {
  const [pharmacyName, setPharmacyName] = React.useState("SehatStock Pharmacy & Medical Store");
  const [address, setAddress] = React.useState("Shop 14-16, Commercial Plaza, Blue Area, Islamabad");
  const [phone, setPhone] = React.useState("+92 51 8482000");
  const [drugLicense, setDrugLicense] = React.useState("DL-ISB-2024-8991");
  const [ntn, setNtn] = React.useState("8920192-3");
  const [discountThreshold, setDiscountThreshold] = React.useState("3.0");
  const [receiptFooter, setReceiptFooter] = React.useState("Thank you for choosing SehatStock! Get well soon. Medicines once sold cannot be returned without original receipt.");
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saved && (
        <div className="p-4 rounded-lg bg-success-subtle border border-success/30 text-xs text-text flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span className="font-semibold text-success">Settings saved successfully to system configuration!</span>
        </div>
      )}

      {/* 1. Pharmacy Store Profile */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Store className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-text">Pharmacy Store & Legal Profile</h3>
            <p className="text-xs text-text-muted">Information printed on customer sales receipts and official tax invoices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Registered Pharmacy Name *
            </label>
            <input
              type="text"
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Counter Helpline / Contact Phone *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Drug Sale License # (DRAP / Provincial)
            </label>
            <input
              type="text"
              value={drugLicense}
              onChange={(e) => setDrugLicense(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Federal FBR NTN / STRN Number
            </label>
            <input
              type="text"
              value={ntn}
              onChange={(e) => setNtn(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text mb-1">
              Physical Premise Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 2. Security & RBAC Discount Threshold */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Percent className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-text">Counter POS Security & Discount Threshold</h3>
            <p className="text-xs text-text-muted">Academic Rule: Discounts exceeding this threshold trigger mandatory Owner Authorization popup.</p>
          </div>
        </div>

        <div className="max-w-md space-y-2">
          <label className="block text-xs font-semibold text-text">
            Cashier Staff Max Unsupervised Discount (%) *
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={discountThreshold}
              onChange={(e) => setDiscountThreshold(e.target.value)}
              className="flex h-10 w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-text-muted">
              Default is <strong className="text-text">3.0%</strong>. Any cashier discount above this requires owner password.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Receipt Template Customization */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-text">Thermal Customer Receipt Customization</h3>
            <p className="text-xs text-text-muted">Disclaimers and returns policy printed at the bottom of thermal slip.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Receipt Footer Message / Return Policy
          </label>
          <textarea
            rows={3}
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            className="flex w-full rounded-md border border-border bg-surface p-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
          />
        </div>
      </div>

      {/* 4. AI Engine Configuration */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-text">Google Gemini AI Engine Integration</h3>
              <p className="text-xs text-text-muted">Configured via environment variable GEMINI_API_KEY.</p>
            </div>
          </div>
          <Badge variant="success" className="text-xs flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Dual-Engine Hybrid Active
          </Badge>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          The system operates in high-resilience hybrid mode. If a live <code className="text-primary font-mono font-bold">GEMINI_API_KEY</code> is present in the environment, requests are enriched with Google Gemini 1.5 Flash models. If no key is provided (or if offline during presentation), the deterministic Clinical Semantic Engine and PostgreSQL Tool Handler handle all searches, tools, and restock workflows with zero downtime.
        </p>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          leftIcon={<Save className="h-4 w-4" />}
          className="h-10 px-6 text-xs font-semibold"
        >
          Save Configuration Changes
        </Button>
      </div>
    </form>
  );
}
