import { useState } from "react";
import { Download, Monitor, Share, Smartphone, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ANDROID_APK_URL, LINUX_APPIMAGE_URL, LINUX_DEB_URL, WINDOWS_INSTALLER_URL,
  detectPlatform, isInstalledApp, useInstallPrompt,
} from "@/lib/installApp";

interface GetAppButtonProps {
  className?: string;
  /** Show the words on very small screens too (for menus and banners). */
  alwaysLabel?: boolean;
}

/** "Get the app" button with the install window for Android, iPhone/iPad, Windows and Linux. Hidden once the portal runs as an installed app. */
const GetAppButton = ({ className = "", alwaysLabel = false }: GetAppButtonProps) => {
  const [open, setOpen] = useState(false);
  const { available, install } = useInstallPrompt();
  if (isInstalledApp()) return null;
  const platform = detectPlatform();
  const first = (...matches: string[]) => (matches.includes(platform) ? "order-first" : "");
  const browserInstall = available && (
    <Button type="button" variant="outline" onClick={() => { install().then((done) => done && setOpen(false)); }}>
      Install from this browser
    </Button>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${className}`}
      >
        <Smartphone className="h-4 w-4" />
        <span className={alwaysLabel ? "" : "hidden sm:inline"}>Get the app</span>
        {!alwaysLabel && <span className="sr-only sm:hidden">Get the app</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Get the Able God College app</DialogTitle>
            <DialogDescription>Open results, fees, attendance and notices from your phone, laptop or desktop.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 text-sm">
            <section className={first("android")}>
              <h3 className="mb-1 flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4" />Android phones and tablets</h3>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={ANDROID_APK_URL} download><Download className="mr-2 h-4 w-4" />Download the Android app</a>
                </Button>
                {platform === "android" && browserInstall}
              </div>
              <p className="mt-2 text-muted-foreground">
                When the download finishes, open the file. If Android asks, allow installs from your browser for this one time, then tap Install.
              </p>
            </section>

            <section className={first("ios")}>
              <h3 className="mb-1 flex items-center gap-2 font-semibold"><Share className="h-4 w-4" />iPhone and iPad</h3>
              <ol className="space-y-2">
                <li className="flex items-start gap-2"><span className="font-semibold">1.</span><span>Open this page in <strong>Safari</strong>.</span></li>
                <li className="flex items-start gap-2"><span className="font-semibold">2.</span><span>Tap the <Share className="mx-1 inline h-4 w-4" /><strong>Share</strong> button.</span></li>
                <li className="flex items-start gap-2"><span className="font-semibold">3.</span><span>Choose <SquarePlus className="mx-1 inline h-4 w-4" /><strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span></li>
              </ol>
              <p className="mt-2 text-muted-foreground">The icon appears on your home screen and opens the portal full screen, like any other app.</p>
            </section>

            <section className={first("windows", "linux", "mac")}>
              <h3 className="mb-1 flex items-center gap-2 font-semibold"><Monitor className="h-4 w-4" />Windows, Linux and Mac computers</h3>
              <div className="flex flex-wrap gap-2">
                {platform !== "linux" && platform !== "mac" && (
                  <Button asChild>
                    <a href={WINDOWS_INSTALLER_URL} download><Download className="mr-2 h-4 w-4" />Windows installer (.exe)</a>
                  </Button>
                )}
                {platform !== "windows" && platform !== "mac" && (
                  <>
                    <Button asChild variant={platform === "linux" ? "default" : "outline"}>
                      <a href={LINUX_APPIMAGE_URL} download><Download className="mr-2 h-4 w-4" />Linux (.AppImage)</a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={LINUX_DEB_URL} download><Download className="mr-2 h-4 w-4" />Debian / Ubuntu (.deb)</a>
                    </Button>
                  </>
                )}
                {(platform === "windows" || platform === "linux" || platform === "mac" || platform === "other") && browserInstall}
              </div>
              <p className="mt-2 text-muted-foreground">
                Windows may show a blue "protected your PC" screen for a new app: choose <strong>More info</strong>, then <strong>Run anyway</strong>.
                On Linux, make the .AppImage file executable and open it, or install the .deb with your software installer.
                No download needed in Chrome or Edge: use <strong>Install from this browser</strong> or the install icon at the right of the address bar.
                {platform === "mac" && " On a Mac in Safari, choose File, then Add to Dock."}
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GetAppButton;
