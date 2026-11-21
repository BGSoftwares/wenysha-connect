import { useState } from "react";
import { Download, Share, Smartphone, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ANDROID_APK_URL, detectPlatform, isInstalledApp, useInstallPrompt } from "@/lib/installApp";

/** "Get the app" button for the dashboard headers. Hidden once the portal is already running as an installed app. */
const GetAppButton = ({ className = "" }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const { available, install } = useInstallPrompt();
  if (isInstalledApp()) return null;
  const platform = detectPlatform();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${className}`}
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Get the app</span>
        <span className="sr-only sm:hidden">Get the app</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Get the Able God College app</DialogTitle>
            <DialogDescription>Open results, fees, attendance and notices from your phone's home screen.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            <section className={platform === "ios" ? "order-2" : ""}>
              <h3 className="mb-1 font-semibold">Android phones and tablets</h3>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={ANDROID_APK_URL} download><Download className="mr-2 h-4 w-4" />Download the Android app</a>
                </Button>
                {available && (
                  <Button type="button" variant="outline" onClick={() => { install().then((done) => done && setOpen(false)); }}>
                    Install from this browser
                  </Button>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">
                When the download finishes, open the file. If Android asks, allow installs from your browser for this one time, then tap Install.
              </p>
            </section>

            <section>
              <h3 className="mb-1 font-semibold">iPhone and iPad</h3>
              <ol className="space-y-2">
                <li className="flex items-start gap-2"><span className="font-semibold">1.</span><span>Open this page in <strong>Safari</strong>.</span></li>
                <li className="flex items-start gap-2"><span className="font-semibold">2.</span><span>Tap the <Share className="mx-1 inline h-4 w-4" /><strong>Share</strong> button.</span></li>
                <li className="flex items-start gap-2"><span className="font-semibold">3.</span><span>Choose <SquarePlus className="mx-1 inline h-4 w-4" /><strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span></li>
              </ol>
              <p className="mt-2 text-muted-foreground">The icon appears on your home screen and opens the portal full screen, like any other app.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GetAppButton;
