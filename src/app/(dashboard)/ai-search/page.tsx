import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AISearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Semantic Search</h1>
            <Badge variant="primary">Mandatory AI Feature #1</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Search medicine catalog using natural language symptoms, generics, and clinical intent.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Vector-Powered Medicine Retrieval</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Query embedding generation with Gemini embeddings and PostgreSQL vector similarity search. Matches queries like &quot;chest congestion and dry cough&quot; to relevant medicines with similarity scores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
