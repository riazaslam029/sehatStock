import { SettingsView } from "@/components/settings/settings-view";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Pharmacy System Settings
            </h1>
            <Badge variant="primary">Owner Only</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Configure cashier discount limits, pharmacy tax credentials, and AI operational parameters.
          </p>
        </div>
      </div>

      <SettingsView />
    </div>
  );
}
