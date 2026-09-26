"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMedicine, MedicineFormData } from "@/lib/actions/medicines";
import { Plus } from "lucide-react";

interface AddMedicineDialogProps {
  categories: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMedicineDialog({
  categories,
  isOpen,
  onClose,
  onSuccess,
}: AddMedicineDialogProps) {
  const [formData, setFormData] = React.useState<MedicineFormData>({
    brandName: "",
    genericName: "",
    categoryId: categories[0]?.id || "",
    strength: "",
    dosageForm: "Tablet",
    manufacturer: "",
    barcode: "",
    basePurchasePrice: "",
    baseSellingPrice: "",
    reorderLevel: 25,
    description: "",
    symptoms: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createMedicine(formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create medicine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Medicine to Formulary"
      description="Register brand name, generic salt formula, clinical indications, and pricing."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded bg-danger-subtle border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Brand Name *
            </label>
            <Input
              required
              placeholder="e.g. Panadol, Augmentin"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Generic / Salt Formula *
            </label>
            <Input
              required
              placeholder="e.g. Paracetamol, Amoxicillin"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Category *
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Dosage Form *
            </label>
            <select
              required
              value={formData.dosageForm}
              onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
              <option value="Inhaler">Inhaler</option>
              <option value="Drops">Eye/Ear Drops</option>
              <option value="Ointment">Cream / Ointment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Strength / Dosage *
            </label>
            <Input
              required
              placeholder="e.g. 500mg, 625mg, 100mcg"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Manufacturer *
            </label>
            <Input
              required
              placeholder="e.g. GSK, Getz, Abbott"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Purchase Cost (PKR) *
            </label>
            <Input
              required
              type="number"
              step="0.01"
              placeholder="e.g. 2.80"
              value={formData.basePurchasePrice}
              onChange={(e) => setFormData({ ...formData, basePurchasePrice: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Retail Price (PKR) *
            </label>
            <Input
              required
              type="number"
              step="0.01"
              placeholder="e.g. 3.50"
              value={formData.baseSellingPrice}
              onChange={(e) => setFormData({ ...formData, baseSellingPrice: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Reorder Warning Level *
            </label>
            <Input
              required
              type="number"
              placeholder="e.g. 25"
              value={formData.reorderLevel.toString()}
              onChange={(e) =>
                setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 20 })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Barcode / SKU
            </label>
            <Input
              placeholder="Scan or enter 13-digit code"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Clinical Indications & Symptoms (for AI Semantic Search)
          </label>
          <Input
            placeholder="e.g. fever, headache, body pain, joint stiffness"
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          />
          <p className="text-[11px] text-text-muted mt-1">
            Separate symptoms with commas. Used by the AI Semantic Search engine.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus className="h-4 w-4" />}>
            Save Medicine
          </Button>
        </div>
      </form>
    </Modal>
  );
}
