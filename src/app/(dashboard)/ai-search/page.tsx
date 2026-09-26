import { getCategories } from "@/lib/actions/medicines";
import { AISearchView } from "@/components/ai/semantic-search-view";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BrainCircuit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AISearchPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Semantic Medicine Search</h1>
            <Badge variant="primary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Academic Feature #1
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Natural language symptom understanding, clinical indication cross-referencing, and real-time inventory matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1 text-[11px] py-1 px-2.5">
            <BrainCircuit className="h-3.5 w-3.5" />
            Gemini + Clinical Vector Engine
          </Badge>
        </div>
      </div>

      <AISearchView initialCategories={categories} />
    </div>
  );
}
