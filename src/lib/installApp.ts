import { useEffect, useState } from "react";

/** Where the Android app (APK) is downloaded from. Built by the "Android app" workflow and published as a GitHub release. */
export const ANDROID_APK_URL: string =
  import.meta.env.VITE_ANDROID_APK_URL
  || "https://github.com/BGSoftwares/wenysha-connect/releases/download/android-latest/able-god-college.apk";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let savedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    savedPrompt = event as BeforeInstallPromptEvent;
  });
}

export const isInstalledApp = () => {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches === true
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);
};

export type DevicePlatform = "android" | "ios" | "other";
export const detectPlatform = (): DevicePlatform => {
  if (typeof navigator === "undefined") return "other";
  const agent = navigator.userAgent;
  // iPadOS 13+ pretends to be a Mac, so look for a touch screen too.
  if (/iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(agent)) return "android";
  return "other";
};

/** Lets a component offer the browser's own "install" prompt where one is available (Chrome, Edge, Samsung Internet). */
export function useInstallPrompt() {
  const [available, setAvailable] = useState(savedPrompt !== null);
  useEffect(() => {
    const onReady = () => setAvailable(true);
    const onInstalled = () => { savedPrompt = null; setAvailable(false); };
    window.addEventListener("beforeinstallprompt", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!savedPrompt) return false;
    await savedPrompt.prompt();
    const choice = await savedPrompt.userChoice;
    savedPrompt = null;
    setAvailable(false);
    return choice.outcome === "accepted";
  };
  return { available, install };
}
