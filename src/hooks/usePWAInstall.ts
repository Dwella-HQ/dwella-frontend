import * as React from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isAndroid, setIsAndroid] = React.useState(false);

  React.useEffect(() => {
    // Check if running on client
    if (typeof window === "undefined") {
      return;
    }

    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect Android
    const userAgent = navigator.userAgent.toLowerCase();
    const android = /android/.test(userAgent);
    setIsAndroid(android);

    // Listen for the beforeinstallprompt event (desktop/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is installable (Android Chrome shows this differently)
    if (android) {
      // On Android, the app is installable if manifest is valid
      // We'll show a custom prompt since beforeinstallprompt may not fire
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!deferredPrompt) {
      // For Android, show instructions
      if (isAndroid) {
        // On Android, we can't programmatically trigger install
        // The user needs to use the browser menu
        return false;
      }
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      return true;
    }

    setDeferredPrompt(null);
    return false;
  }, [deferredPrompt, isAndroid]);

  return {
    isInstallable,
    isInstalled,
    isAndroid,
    promptInstall,
    deferredPrompt,
  };
};

