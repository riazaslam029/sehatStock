import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Pharmacy Assistant</h1>
            <Badge variant="primary">Mandatory AI Feature #2</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Operational pharmacy intelligence executing controlled backend database tools.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-4">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-text">Tool-Calling Pharmacy Assistant</h3>
          <p className="text-xs text-text-muted max-w-md mt-1">
            Directly answers questions on low stock, expiring batches, today&apos;s revenue, and vendor purchase history through safe, controlled backend functions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
