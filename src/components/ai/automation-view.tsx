"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  RestockWorkflowItem,
  runRestockScan,
  approveRestockWorkflow,
  rejectRestockWorkflow,
} from "@/lib/ai/automation";
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Building2,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import Link from "next/link";

interface AutomationViewProps {
  initialWorkflows: RestockWorkflowItem[];
  suppliers: Array<{ id: string; companyName: string }>;
  userRole: "OWNER" | "STAFF";
}

export function AutomationView({
  initialWorkflows,
  suppliers,
  userRole,
}: AutomationViewProps) {
  const [workflows, setWorkflows] = React.useState<RestockWorkflowItem[]>(initialWorkflows);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [editQuantities, setEditQuantities] = React.useState<Record<string, number>>({});
  const [editSuppliers, setEditSuppliers] = React.useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");

  const pendingList = workflows.filter((w) => w.status === "PENDING_APPROVAL" || w.status === "DRAFT_CREATED");
  const historyList = workflows.filter((w) => w.status === "APPROVED" || w.status === "REJECTED" || w.status === "COMPLETED");

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);

    try {
      const res = await runRestockScan();
      setScanMessage(res.message);
      // Refresh page or state
      window.location.reload();
    } catch (err: unknown) {
      setScanMessage((err as Error)?.message || "Failed to complete restock scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApprove = async (workflow: RestockWorkflowItem) => {
    if (userRole !== "OWNER") {
      alert("Unauthorized: Only pharmacy owners have authority to approve purchase orders.");
      return;
    }

    setProcessingId(workflow.id);
    const chosenQty = editQuantities[workflow.id] || workflow.recommendedOrderQty;
    const chosenSupplier = editSuppliers[workflow.id] || workflow.supplierId || suppliers[0]?.id;

    try {
      const res = await approveRestockWorkflow(workflow.id, chosenQty, chosenSupplier);
      if (res.success) {
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflow.id
              ? {
                  ...w,
                  status: "APPROVED",
                  recommendedOrderQty: chosenQty,
                  purchaseRefNo: res.referenceNo,
                  reviewedByName: "Current Owner",
                  reviewedAt: new Date(),
                }
              : w
          )
        );
      } else {
        alert(res.error || "Approval failed.");
      }
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to approve workflow.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (workflowId: string) => {
    if (userRole !== "OWNER") {
      alert("Unauthorized: Only pharmacy owners have authority to reject restock workflows.");
      return;
    }

    setProcessingId(workflowId);
    try {
      await rejectRestockWorkflow(workflowId, "Dismissed by owner at counter review");
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId
            ? { ...w, status: "REJECTED", reviewedByName: "Current Owner", reviewedAt: new Date() }
            : w
        )
      );
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to reject.");
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* State Machine Visualizer */}
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Autonomous Restock Lifecycle State Machine
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Continuous monitoring with strict Human-in-the-Loop Owner verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={userRole === "OWNER" ? "success" : "warning"}
              className="text-xs py-1 px-2.5 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Role: {userRole} ({userRole === "OWNER" ? "Full Approval Authority" : "Read-Only / No PO Authority"})
            </Badge>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleScan}
              isLoading={isScanning}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="text-xs h-8"
            >
              Trigger AI Restock Scan
            </Button>
          </div>
        </div>

        {/* State Machine Steps */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
          {[
            { step: "1. DETECTED", desc: "Stock <= Safety Reorder Level", active: true },
            { step: "2. ANALYZING", desc: "30-Day Velocity & Lead Time", active: true },
            { step: "3. DRAFT_CREATED", desc: "Calculated Order Qty & Cost", active: true },
            { step: "4. PENDING_APPROVAL", desc: "Owner Verification Guard", active: pendingList.length > 0 },
            { step: "5. APPROVED", desc: "Official PO Issued to Vendor", active: historyList.length > 0 },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center transition-all ${
                s.active
                  ? "bg-primary-subtle/40 border-primary/40 text-text"
                  : "bg-surface-muted/50 border-border text-text-muted opacity-60"
              }`}
            >
              <div className="font-mono text-xs font-bold text-primary flex items-center justify-center gap-1">
                <span>{s.step}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>

        {scanMessage && (
          <div className="p-3 rounded bg-success-subtle border border-success/30 text-xs text-text flex items-center gap-2 animate-slide-up">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs: Pending Approvals vs Audit History */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-primary text-primary-contrast shadow-sm"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <span>Pending Owner Approvals</span>
          <Badge variant={pendingList.length > 0 ? "warning" : "outline"} className="text-[10px]">
            {pendingList.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-primary text-primary-contrast shadow-sm"
              : "text-text-muted hover:text-text hover:bg-surface-muted"
          }`}
        >
          <span>Workflow Audit & Purchase Orders</span>
          <Badge variant="outline" className="text-[10px]">
            {historyList.length}
          </Badge>
        </button>
      </div>

      {/* TAB 1: PENDING OWNER APPROVALS */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-12 text-center shadow-card space-y-3">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              <h4 className="text-sm font-semibold text-text">Zero Pending Purchase Approvals</h4>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                All inventory levels are safely stocked. Click &quot;Trigger AI Restock Scan&quot; above to re-evaluate active stock against real-time consumption rates.
              </p>
            </div>
          ) : (
            pendingList.map((item) => {
              const currentQty = editQuantities[item.id] !== undefined
                ? editQuantities[item.id]
                : item.recommendedOrderQty;
              const selectedSupplier = editSuppliers[item.id] || item.supplierId || suppliers[0]?.id;
              const estimatedCost = currentQty * item.basePurchasePrice;
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-surface p-6 shadow-card hover:border-primary/40 transition-all space-y-4"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-text">{item.medicineName}</h3>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {item.strength}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.dosageForm}
                        </Badge>
                        <Badge variant="danger" className="text-[10px] flex items-center gap-1 font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          Stock: {item.currentStock} / Threshold: {item.reorderLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {item.genericName} • {item.categoryName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-muted border border-border text-xs text-text-muted">
                        <TrendingUp className="h-3.5 w-3.5 text-info" />
                        <span>30-Day Velocity: <strong className="text-text">{item.salesVelocity30d} units</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AI Pharmacological Reasoning Box */}
                  <div className="rounded-lg bg-primary-subtle/40 border border-primary/20 p-3.5 text-xs text-text space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Demand Analysis & Clinical Rationale:</span>
                    </div>
                    <p className="text-xs leading-relaxed text-text">
                      {item.reasoning}
                    </p>
                  </div>

                  {/* Restock Configuration Row (Editable by Owner) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Order Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        Approved Order Quantity (Packs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentQty}
                        onChange={(e) =>
                          setEditQuantities({
                            ...editQuantities,
                            [item.id]: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="text-[10px] text-text-muted mt-1 block">
                        Base unit cost: {formatPKR(item.basePurchasePrice)}
                      </span>
                    </div>

                    {/* Preferred Supplier */}
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        Procurement Supplier *
                      </label>
                      <select
                        value={selectedSupplier}
                        onChange={(e) =>
                          setEditSuppliers({
                            ...editSuppliers,
                            [item.id]: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {suppliers.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.companyName}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-text-muted mt-1 block flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Authorized distributor
                      </span>
                    </div>

                    {/* Total Estimated PO Value */}
                    <div>
                      <span className="block text-xs font-semibold text-text mb-1">
                        Estimated Purchase Order Total
                      </span>
                      <div className="h-10 rounded-md border border-border bg-surface-muted px-3 flex items-center font-bold text-base text-primary">
                        {formatPKR(estimatedCost)}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 block">
                        Official PO will be created in pending state
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                    <div className="text-xs text-text-muted">
                      {userRole === "OWNER" ? (
                        <span className="text-success font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ready for Owner Authorization
                        </span>
                      ) : (
                        <span className="text-warning font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Cashier/Staff cannot approve purchases. Owner signoff required.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        disabled={isProcessing}
                        onClick={() => handleReject(item.id)}
                        className="text-xs h-9"
                      >
                        Dismiss
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        disabled={userRole !== "OWNER" || isProcessing}
                        isLoading={isProcessing}
                        onClick={() => handleApprove(item)}
                        leftIcon={<FileCheck className="h-4 w-4" />}
                        className="text-xs h-9"
                      >
                        Approve & Generate Purchase Order
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: AUDIT & APPROVED POs */}
      {activeTab === "history" && (
        <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-text">Restock Automation Audit Trail</h3>
            <span className="text-xs text-text-muted">{historyList.length} recorded workflows</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Order Qty</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Created PO #</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-text-muted text-xs">
                    No approved or rejected restock workflows yet.
                  </TableCell>
                </TableRow>
              ) : (
                historyList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "APPROVED"
                            ? "success"
                            : item.status === "REJECTED"
                            ? "danger"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-text">{item.medicineName}</span>
                        <span className="text-[11px] text-text-muted">{item.strength}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{item.recommendedOrderQty} units</TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {item.supplierName || "Default Supplier"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {item.purchaseRefNo || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {item.reviewedByName || "Owner"}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {item.reviewedAt ? formatDate(item.reviewedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchaseRefNo ? (
                        <Link
                          href="/purchases"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                        >
                          <span>View in Purchases</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
