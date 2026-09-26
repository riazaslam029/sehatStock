"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPKR } from "@/lib/utils";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Sparkles,
  Bot,
  Cpu,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Quick Counter Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Pharmacy Operations Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time physical counter telemetry, batch FEFO monitoring, and AI recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/ai-search">
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-4 w-4 text-primary" />}>
              AI Search
            </Button>
          </Link>
          <Link href="/pos">
            <Button variant="primary" size="sm" leftIcon={<ShoppingCart className="h-4 w-4" />}>
              Open Counter POS (F2)
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Academic AI Features Highlight Bar */}
      <div className="rounded-xl border border-primary/20 bg-primary-subtle/50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text">
                  Academic AI Integration Status
                </h4>
                <Badge variant="success">All 3 Features Active</Badge>
              </div>
              <p className="text-xs text-text-muted">
                Mandatory university requirements: Gemini embeddings vector search, database tool-calling agent, and low-stock automation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/ai-search">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>1. Semantic Search</span>
              </div>
            </Link>
            <Link href="/ai-assistant">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span>2. Operational Chatbot</span>
              </div>
            </Link>
            <Link href="/automation">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>3. Restock Workflow</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatPKR(142500)}
          subtitle="48 customer invoices generated"
          trend={{ value: "+14.2% vs yesterday", isPositive: true }}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />

        <StatCard
          title="Gross Profit"
          value={formatPKR(38200)}
          subtitle="Estimated margin: 26.8%"
          trend={{ value: "+8.5%", isPositive: true }}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />

        <StatCard
          title="Inventory Valuation"
          value={formatPKR(2840000)}
          subtitle="412 medicines in stock across batches"
          icon={<PackageCheck className="h-5 w-5" />}
          variant="info"
        />

        <StatCard
          title="Stock Alerts"
          value="7 Critical"
          subtitle="3 items near expiry (≤30 days)"
          trend={{ value: "Action Required", isPositive: false }}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
      </div>

      {/* Mid Section: Recent Sales + AI Restock Recommendation Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Counter Invoices Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">
                  Recent Counter Invoices
                </CardTitle>
                <CardDescription>
                  Real-time sales processed at pharmacy terminals
                </CardDescription>
              </div>
              <Link href="/invoices">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      id: "INV-2026-089",
                      items: "Panadol 500mg (2), Augmentin 625mg (1)",
                      payment: "Cash",
                      total: 980,
                      cashier: "Ayesha T.",
                    },
                    {
                      id: "INV-2026-088",
                      items: "Softin 10mg (1), Disprin 300mg (1)",
                      payment: "Easypaisa",
                      total: 420,
                      cashier: "Ayesha T.",
                    },
                    {
                      id: "INV-2026-087",
                      items: "Nexum 40mg (1), Brufen 400mg (2)",
                      payment: "Card",
                      total: 1350,
                      cashier: "Dr. Hamza M.",
                    },
                    {
                      id: "INV-2026-086",
                      items: "Risek 20mg (2), Panadol CF (1)",
                      payment: "Cash",
                      total: 890,
                      cashier: "Ayesha T.",
                    },
                  ].map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-semibold text-text">
                        {invoice.id}
                      </TableCell>
                      <TableCell className="text-xs text-text-muted truncate max-w-[200px]">
                        {invoice.items}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.payment}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-text">
                        {formatPKR(invoice.total)}
                      </TableCell>
                      <TableCell className="text-xs text-text-muted">
                        {invoice.cashier}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/invoices`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            View Receipt
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Automation Teaser & Quick Action Box */}
        <div className="space-y-6">
          {/* AI Restock Suggestion Alert Card */}
          <Card className="border-primary/30 bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" className="gap-1">
                  <Cpu className="h-3 w-3" />
                  AI Restock Engine
                </Badge>
                <span className="text-[11px] text-text-muted">Updated 5m ago</span>
              </div>
              <CardTitle className="text-base font-bold pt-2">
                Purchase Draft Ready
              </CardTitle>
              <CardDescription>
                Low stock detected on fast-moving medicines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="p-3 rounded-lg bg-surface-muted border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text">Panadol 500mg Tabs</span>
                  <span className="text-danger font-bold">12 units left</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-danger h-full rounded-full w-[15%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Reorder Level: 50 units</span>
                  <span>AI Rec: +200 units</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-muted border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text">Augmentin 625mg</span>
                  <span className="text-warning font-bold">8 packs left</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-warning h-full rounded-full w-[20%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Reorder Level: 20 packs</span>
                  <span>AI Rec: +50 packs</span>
                </div>
              </div>

              <Link href="/automation" className="block pt-1">
                <Button variant="primary" className="w-full text-xs font-semibold" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Review & Approve AI Purchase Order
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Counter Shortcuts Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Terminal Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">Point of Sale (POS)</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-muted border border-border font-mono font-bold text-text">
                  F2
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">AI Semantic Search</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-muted border border-border font-mono font-bold text-text">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-muted">Customer Return</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-muted border border-border font-mono font-bold text-text">
                  F4
                </kbd>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
