"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/utils";
import {
  searchMedicinesSemantically,
  SemanticSearchResult,
  SemanticSearchResponse,
} from "@/lib/ai/semantic-search";
import {
  Search,
  Sparkles,
  Zap,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Stethoscope,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

interface AISearchViewProps {
  initialCategories: Array<{ id: string; name: string }>;
}

const DEMO_QUERIES = [
  {
    label: "Fever & Body Aches",
    query: "Patient has high fever, body pain and severe headache",
    icon: "🤒",
  },
  {
    label: "Throat & Chest Infection",
    query: "Severe bacterial throat infection with difficulty swallowing and tonsillitis",
    icon: "🫁",
  },
  {
    label: "Heartburn & Acidity",
    query: "Severe acid reflux, heartburn and burning sensation in stomach",
    icon: "🔥",
  },
  {
    label: "Dust Allergy & Sneezing",
    query: "Continuous sneezing, runny nose and dust allergy with watery eyes",
    icon: "🤧",
  },
  {
    label: "Diarrhea & Stomach Cramps",
    query: "Loose motions, severe abdominal cramps and bacterial food poisoning",
    icon: "🦠",
  },
  {
    label: "Joint & Muscle Pain",
    query: "Severe joint swelling, muscular strain, arthritis inflammation",
    icon: "🦴",
  },
];

export function AISearchView({ initialCategories }: AISearchViewProps) {
  const [query, setQuery] = React.useState("Patient has high fever, body pain and severe headache");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [filterInStockOnly, setFilterInStockOnly] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [resultsData, setResultsData] = React.useState<SemanticSearchResponse | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  const performSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : query).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await searchMedicinesSemantically(q, selectedCategory);
      setResultsData(response);
    } catch (err) {
      console.error("Semantic search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Run initial demo search on mount
  React.useEffect(() => {
    performSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredResults = React.useMemo(() => {
    if (!resultsData) return [];
    let list = resultsData.results;
    if (filterInStockOnly) {
      list = list.filter((r) => r.inStock);
    }
    return list;
  }, [resultsData, filterInStockOnly]);

  return (
    <div className="space-y-6">
      {/* Search Input Box & Engine Status */}
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Describe symptoms, colloquial complaints, or salt formulas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && performSearch()}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-11 text-sm pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => performSearch()}
              isLoading={isSearching}
              className="h-11 px-5"
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Analyze Symptoms
            </Button>
            {query && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setQuery("")}
                className="h-11 px-3 text-text-muted hover:text-text"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Teacher Evaluation Quick Presets */}
        <div className="space-y-2 pt-1 border-t border-border">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold flex items-center gap-1.5 text-text">
              <Zap className="h-3.5 w-3.5 text-warning" />
              Teacher Evaluation Quick Queries (Click to test semantic matching):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DEMO_QUERIES.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(demo.query);
                  performSearch(demo.query);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  query === demo.query
                    ? "bg-primary text-primary-contrast border-primary font-semibold shadow-sm"
                    : "bg-surface-muted hover:bg-primary-subtle hover:text-primary border-border text-text"
                }`}
              >
                <span>{demo.icon}</span>
                <span>{demo.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meta Bar: Results count, Category Filters, and Engine Status */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {resultsData && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text">
                {filteredResults.length} Matched Medicines
              </span>
              <Badge variant="outline" className="text-[10px]">
                Query: &quot;{resultsData.query.slice(0, 35)}...&quot;
              </Badge>
            </div>
          )}

          {resultsData && (
            <Badge
              variant={resultsData.source === "GEMINI_API" ? "success" : "primary"}
              className="text-[10px] flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {resultsData.source === "GEMINI_API"
                ? "Powered by Google Gemini 1.5 Flash"
                : "Powered by Clinical Semantic Engine"}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              performSearch(query);
            }}
            className="h-8 rounded border border-border bg-surface px-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {initialCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-text cursor-pointer select-none bg-surface border border-border rounded px-2.5 h-8">
            <input
              type="checkbox"
              checked={filterInStockOnly}
              onChange={(e) => setFilterInStockOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>In-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Search Results Grid */}
      {isSearching ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center shadow-card space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-semibold text-text">Analyzing clinical intent...</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Extracting symptoms, cross-referencing pharmacological indications, and ranking matches with similarity scores.
          </p>
        </div>
      ) : hasSearched && filteredResults.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center shadow-card space-y-2">
          <HelpCircle className="h-8 w-8 text-text-muted mx-auto" />
          <h4 className="text-sm font-semibold text-text">No clinical matches found</h4>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Try adjusting your symptom query or selecting &quot;All Categories&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map((med: SemanticSearchResult) => {
            const isHighMatch = med.similarityScore >= 80;
            const isMediumMatch = med.similarityScore >= 60;

            return (
              <div
                key={med.id}
                className="rounded-lg border border-border bg-surface p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Brand Name, Generic salt, and Match Score Pill */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-text">
                          {med.brandName}
                        </h3>
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {med.strength}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">

                          {med.dosageForm}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {med.genericName}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {med.manufacturer} • {med.categoryName}
                      </p>
                    </div>

                    {/* Similarity Score Meter */}
                    <div className="text-right shrink-0">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isHighMatch
                            ? "bg-success-subtle text-success border border-success/30"
                            : isMediumMatch
                            ? "bg-warning-subtle text-warning border border-warning/30"
                            : "bg-primary-subtle text-primary border border-primary/30"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{med.similarityScore}% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Match Reasoning Callout */}
                  <div className="rounded bg-primary-subtle/40 border border-primary/20 p-2.5 text-xs text-text space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Clinical Rationale & Mechanism:</span>
                    </div>
                    <p className="text-[11px] text-text leading-relaxed">
                      {med.matchReasoning}
                    </p>
                  </div>

                  {/* Matched Indication Keywords */}
                  {med.matchedSymptoms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-text-muted">Addressed symptoms:</span>
                      {med.matchedSymptoms.map((sym, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] px-2 py-0.5 rounded bg-surface-muted border border-border text-text font-medium"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: Live Stock, Pricing, and Action Button */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {med.inStock ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-success">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{med.totalStock} units in stock</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-danger">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      )}

                      {med.inStock && med.isLowStock && (
                        <Badge variant="warning" className="text-[10px]">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Price: <span className="font-bold text-text">{formatPKR(med.baseSellingPrice)}</span> / unit
                    </div>
                  </div>

                  {/* POS Integration Link */}
                  <Link
                    href={`/pos?add=${encodeURIComponent(med.barcode || med.id)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md bg-primary text-primary-contrast hover:bg-primary-hover shadow-sm transition-all shrink-0"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Sell at POS</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
