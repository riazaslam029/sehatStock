"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import { BatchItem } from "@/lib/actions/inventory";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Boxes,
  History,
  ShieldCheck,
} from "lucide-react";

export interface StockMovementItem {
  id: string;
  medicineName: string;
  batchNumber: string;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  notes: string | null;
  userName: string | null;
  createdAt: Date | string;
}

interface BatchTableProps {
  batches: BatchItem[];
  movements: StockMovementItem[];
  canEdit: boolean;
}

export function BatchTable({ batches, movements, canEdit }: BatchTableProps) {
  const [activeTab, setActiveTab] = React.useState<"ALL" | "NEAR_EXPIRY" | "EXPIRED" | "AUDIT">("ALL");
  const [search, setSearch] = React.useState("");
  const [selectedBatch, setSelectedBatch] = React.useState<BatchItem | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);

  // Group FEFO index per medicine
  const fefoRanks: Record<string, number> = {};

  const filteredBatches = React.useMemo(() => {
    return batches
      .filter((b) => {
        if (activeTab === "NEAR_EXPIRY") return b.expiryStatus === "NEAR_EXPIRY";
        if (activeTab === "EXPIRED") return b.expiryStatus === "EXPIRED";
        return true;
      })
      .filter((b) => {
        const s = search.toLowerCase();
        return (
          b.medicineName.toLowerCase().includes(s) ||
          b.genericName.toLowerCase().includes(s) ||
          b.batchNumber.toLowerCase().includes(s) ||
          b.supplierName.toLowerCase().includes(s)
        );
      });
  }, [batches, activeTab, search]);

  return (
    <div className="space-y-4">
      {/* Tab Filter Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "ALL" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ALL")}
            className="text-xs"
          >
            All Active Batches ({batches.length})
          </Button>

          <Button
            variant={activeTab === "NEAR_EXPIRY" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("NEAR_EXPIRY")}
            className="text-xs"
            leftIcon={<Clock className="h-3.5 w-3.5 text-warning" />}
          >
            Near Expiry ≤ 30 Days (
            {batches.filter((b) => b.expiryStatus === "NEAR_EXPIRY").length})
          </Button>

          <Button
            variant={activeTab === "EXPIRED" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("EXPIRED")}
            className="text-xs"
            leftIcon={<AlertTriangle className="h-3.5 w-3.5 text-danger" />}
          >
            Expired ({batches.filter((b) => b.expiryStatus === "EXPIRED").length})
          </Button>

          <Button
            variant={activeTab === "AUDIT" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("AUDIT")}
            className="text-xs"
            leftIcon={<History className="h-3.5 w-3.5" />}
          >
            Movement Audit Trail ({movements.length})
          </Button>
        </div>

        {activeTab !== "AUDIT" && (
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search batch or medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {activeTab === "AUDIT" ? (
        <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Movement Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Balance After</TableHead>
                <TableHead>Audit Notes</TableHead>
                <TableHead>Authorized User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-text-muted">
                    No recorded stock movements yet.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-text-muted">
                      {new Date(m.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-text">{m.medicineName}</TableCell>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {m.batchNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.movementType === "PURCHASE" || m.movementType === "RETURN"
                            ? "success"
                            : m.movementType === "SALE"
                            ? "primary"
                            : "danger"
                        }
                        className="text-[10px]"
                      >
                        {m.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-bold text-xs ${m.quantity > 0 ? "text-success" : "text-danger"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{m.balanceAfter}</TableCell>
                    <TableCell className="text-xs text-text-muted max-w-[200px] truncate">
                      {m.notes || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">{m.userName || "System"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FEFO Priority</TableHead>
                <TableHead>Medicine & Strength</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Remaining Days</TableHead>
                <TableHead>Inward Supplier</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Available Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <Boxes className="h-8 w-8 text-text-muted/50 mb-2" />
                      <p className="font-semibold text-sm">No batches match this filter</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((b) => {
                  fefoRanks[b.medicineId] = (fefoRanks[b.medicineId] || 0) + 1;
                  const rank = fefoRanks[b.medicineId];

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rank === 1
                              ? "bg-primary-subtle text-primary border border-primary/30"
                              : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {rank === 1 ? (
                            <>
                              <ShieldCheck className="h-3 w-3 text-primary" />
                              Next to Dispense
                            </>
                          ) : (
                            `Queue #${rank}`
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-text">{b.medicineName}</span>
                          <span className="text-xs text-text-muted">
                            {b.genericName} • {b.strength}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-text">
                        {b.batchNumber}
                      </TableCell>
                      <TableCell className="text-xs text-text font-medium">
                        {formatDate(b.expiryDate)}
                      </TableCell>
                      <TableCell>
                        {b.expiryStatus === "EXPIRED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-subtle text-danger border border-danger/20">
                            <AlertTriangle className="h-3 w-3" />
                            Expired ({Math.abs(b.daysToExpiry)}d ago)
                          </span>
                        ) : b.expiryStatus === "NEAR_EXPIRY" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-subtle text-warning border border-warning/20">
                            <Clock className="h-3 w-3" />
                            {b.daysToExpiry} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success/20">
                            <CheckCircle2 className="h-3 w-3" />
                            {b.daysToExpiry} days
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-muted">{b.supplierName}</TableCell>
                      <TableCell className="text-xs text-text-muted">
                        {formatPKR(parseFloat(b.purchasePrice))}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-text">
                        {formatPKR(parseFloat(b.sellingPrice))}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-sm text-text">{b.quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedBatch(b);
                              setIsAdjustOpen(true);
                            }}
                            leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                          >
                            Adjust
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AdjustStockDialog
        batch={selectedBatch}
        isOpen={isAdjustOpen}
        onClose={() => {
          setIsAdjustOpen(false);
          setSelectedBatch(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
