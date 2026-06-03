"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// =============================================
// PWA Install Button — Shows install prompt on supported browsers
// =============================================
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  }

  if (installed || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-emerald-600 text-[var(--text-primary)] rounded-2xl shadow-2xl p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
          
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Omix</p>
          <p className="text-xs text-emerald-100 mt-0.5">
            Add to home screen for faster access & offline browsing
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 glass-card text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-50 transition"
        >
          Install Now
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="px-3 py-2 text-emerald-100 text-sm hover:bg-white/10 rounded-lg transition"
        >
          Later
        </button>
      </div>
    </div>
  );
}
