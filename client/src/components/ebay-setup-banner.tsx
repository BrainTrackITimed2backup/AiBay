import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EbaySetupBanner() {
  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-300">
        <strong>Live market API access is limited.</strong> To unlock broader live market coverage, add your provider credentials{" "}
        <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs font-mono">
          in Settings → Secrets
        </code>{" "}
        . The app will continue using scraping-backed results when credentials are unavailable.
      </AlertDescription>
    </Alert>
  );
}
