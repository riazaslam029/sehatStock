"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatPKR } from "@/lib/utils";
import { AnalyticsSummary } from "@/lib/actions/reports";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  Download,
  CreditCard,
  Pill,
  Percent,
} from "lucide-react";



interface ReportsViewProps {
  summary: AnalyticsSummary;
}

export function ReportsView({ summary }: ReportsViewProps) {
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Medicine,Generic,Units Sold,Revenue (PKR)\n" +
      summary.topMedicines
        .map((m) => `"${m.name}","${m.generic}",${m.unitsSold},${m.revenue}`)
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sehatstock_dispensing_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCatRevenue = summary.categorySales.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Financial & Dispensing Intelligence
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Aggregated transactional telemetry across physical counters and payment gateways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
            className="text-xs h-9"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Invoiced"
          value={formatPKR(summary.totalGrossRevenue)}
          subtitle={`${summary.totalInvoices} counter transactions`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />

        <StatCard
          title="Net Revenue Realized"
          value={formatPKR(summary.totalNetRevenue)}
          subtitle={`After PKR ${summary.totalDiscounts.toFixed(2)} discounts`}
          trend={{ value: "Operational Revenue", isPositive: true }}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />

        <StatCard
          title="Average Basket Size"
          value={formatPKR(summary.averageBasketValue)}
          subtitle="Mean revenue per transaction"
          icon={<Receipt className="h-5 w-5" />}
          variant="info"
        />

        <StatCard
          title="Discounts Granted"
          value={formatPKR(summary.totalDiscounts)}
          subtitle={`${summary.totalGrossRevenue > 0 ? ((summary.totalDiscounts / summary.totalGrossRevenue) * 100).toFixed(1) : "0"}% of gross sales`}
          icon={<Percent className="h-5 w-5" />}
          variant="warning"
        />

      </div>

      {/* Middle Grid: Category Breakdown + Payment Gateway Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Therapeutic Category */}
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Sales by Therapeutic Category
            </h3>
            <span className="text-xs text-text-muted">
              {summary.categorySales.length} categories active
            </span>
          </div>

          <div className="space-y-3">
            {summary.categorySales.map((cat, idx) => {
              const pct = totalCatRevenue > 0 ? (cat.revenue / totalCatRevenue) * 100 : 0;

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">{cat.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-text">{formatPKR(cat.revenue)}</span>
                      <span className="text-text-muted text-[11px] ml-1.5">({cat.unitsSold} units • {pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels Mix */}
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Counter Payment Channels Mix
            </h3>
            <span className="text-xs text-text-muted">Cash vs Digital</span>
          </div>

          <div className="space-y-3">
            {summary.paymentMethods.map((pm, idx) => {
              const pct = summary.totalNetRevenue > 0 ? (pm.amount / summary.totalNetRevenue) * 100 : 0;

              return (
                <div key={idx} className="p-3 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-bold text-xs py-1">
                      {pm.name}
                    </Badge>
                    <span className="text-xs text-text-muted">{pm.count} transactions</span>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-text">{formatPKR(pm.amount)}</div>
                    <div className="text-[10px] text-text-muted">{pct.toFixed(1)}% of net collections</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Table: Fast-Moving & Top Dispensed Medicines */}
      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-text flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Top Dispensed Medicines by Sales Volume
          </h3>
          <span className="text-xs text-text-muted">Ranked by units dispensed</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Generic Salt Formula</TableHead>
              <TableHead>Units Dispensed</TableHead>
              <TableHead className="text-right">Realized Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.topMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-text-muted text-xs">
                  No sales recorded yet. Dispense items at the POS to generate rankings.
                </TableCell>
              </TableRow>
            ) : (
              summary.topMedicines.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-xs text-primary">#{idx + 1}</TableCell>
                  <TableCell className="font-bold text-xs text-text">{m.name}</TableCell>
                  <TableCell className="text-xs text-text-muted">{m.generic}</TableCell>
                  <TableCell className="font-medium text-xs text-text">
                    <Badge variant="outline">{m.unitsSold} units</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs text-success">
                    {formatPKR(m.revenue)}
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
