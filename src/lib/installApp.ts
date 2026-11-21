import { useEffect, useState } from "react";

/** Where the Android app (APK) is downloaded from. Built by the "Android app" workflow and published as a GitHub release. */
export const ANDROID_APK_URL: string =
  import.meta.env.VITE_ANDROID_APK_URL
  || "https://github.com/BGSoftwares/wenysha-connect/releases/download/android-latest/able-god-college.apk";

const DESKTOP_BASE = "https://github.com/BGSoftwares/wenysha-connect/releases/download/desktop-latest";
export const WINDOWS_INSTALLER_URL: string = import.meta.env.VITE_WINDOWS_INSTALLER_URL || `${DESKTOP_BASE}/Able-God-College-Setup.exe`;
export const LINUX_APPIMAGE_URL: string = import.meta.env.VITE_LINUX_APPIMAGE_URL || `${DESKTOP_BASE}/Able-God-College.AppImage`;
export const LINUX_DEB_URL: string = import.meta.env.VITE_LINUX_DEB_URL || `${DESKTOP_BASE}/Able-God-College.deb`;

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

export type DevicePlatform = "android" | "ios" | "windows" | "linux" | "mac" | "other";
export const detectPlatform = (): DevicePlatform => {
  if (typeof navigator === "undefined") return "other";
  const agent = navigator.userAgent;
  // iPadOS 13+ pretends to be a Mac, so look for a touch screen too.
  if (/iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(agent)) return "android";
  if (/Windows/i.test(agent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(agent)) return "mac";
  if (/Linux|X11|CrOS/i.test(agent)) return "linux";
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
