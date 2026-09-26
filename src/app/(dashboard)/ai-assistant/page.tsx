import { ChatbotView } from "@/components/ai/chatbot-view";
import { Badge } from "@/components/ui/badge";
import { Bot, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">AI Pharmacy Operations Assistant</h1>
            <Badge variant="primary" className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              Academic Feature #2
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Autonomous operational assistant executing controlled PostgreSQL database tools with Gemini function-calling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1 text-[11px] py-1 px-2.5">
            <Terminal className="h-3.5 w-3.5" />
            6 Tool Handlers Connected
          </Badge>
        </div>
      </div>

      <ChatbotView />
    </div>
  );
}
