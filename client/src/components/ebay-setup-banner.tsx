import { Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EbaySetupBanner() {
  return (
    <Alert className="border-blue-500/40 bg-blue-50 dark:bg-blue-950/30 mb-6">
      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-300">
        <strong>Live scraping mode is active.</strong> Data is fetched in real time from public marketplace sources.
        Optional API credentials can improve reliability during rate limits, but the platform does not require
        developer onboarding to run.
      </AlertDescription>
    </Alert>
  );
}
