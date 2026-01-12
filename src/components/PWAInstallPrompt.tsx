import * as React from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X } from "lucide-react";

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isAndroid, promptInstall } =
    usePWAInstall();
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if user has dismissed the prompt before
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = React.useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  }, []);

  const handleInstall = React.useCallback(async () => {
    if (isAndroid) {
      // On Android, we can't programmatically install
      // Show instructions instead
      return;
    }
    await promptInstall();
  }, [isAndroid, promptInstall]);

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {isAndroid ? "Install Dwella App" : "Install Dwella App"}
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              {isAndroid ? (
                <>
                  Add Dwella to your home screen for quick access. Tap the menu
                  (⋮) and select{" "}
                  <span className="font-medium">"Add to Home screen"</span> or{" "}
                  <span className="font-medium">"Install app"</span>.
                </>
              ) : (
                "Install Dwella for a better experience with quick access and offline support."
              )}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isAndroid && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full rounded-md bg-brand-main px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Install Now
          </button>
        )}
      </div>
    </div>
  );
};

