"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { createSupplierAction, SupplierFormData } from "@/lib/actions/suppliers";
import { Plus, Search, Building2, Phone, Mail, MapPin } from "lucide-react";

interface SupplierItem {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  ntn: string | null;
  status: string;
}

export function SupplierView({ suppliers, canEdit }: { suppliers: SupplierItem[]; canEdit: boolean }) {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<SupplierFormData>({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    ntn: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.ntn && s.ntn.includes(search))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await createSupplierAction(formData);
    setIsLoading(false);
    if (res.success) {
      setIsOpen(false);
      window.location.reload();
    } else {
      setError("Failed to create supplier.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search supplier or distributor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Supplier
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distributor / Company</TableHead>
              <TableHead>Contact Representative</TableHead>
              <TableHead>Phone & Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>NTN #</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-subtle text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-text">{s.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text">{s.contactPerson || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-text-muted">
                      {s.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {s.phone}
                        </span>
                      )}
                      {s.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted max-w-[200px] truncate">
                    {s.address ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {s.address}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-muted">{s.ntn || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="success">Active Partner</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Register New Pharmaceutical Supplier"
        description="Add distributor details for purchase orders and batch inventory tracking."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-danger-subtle text-xs text-danger">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Company / Distributor Name *</label>
            <Input
              required
              placeholder="e.g. GlaxoSmithKline Pakistan"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Representative Name</label>
              <Input
                placeholder="e.g. Tariq Mehmood"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Contact Phone</label>
              <Input
                placeholder="e.g. +92 300 1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="orders@distributor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">NTN / Tax Registration</label>
              <Input
                placeholder="e.g. 0711902-3"
                value={formData.ntn}
                onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Warehouse / Depot Address</label>
            <Input
              placeholder="e.g. West Wharf Road, Karachi"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus className="h-4 w-4" />}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
