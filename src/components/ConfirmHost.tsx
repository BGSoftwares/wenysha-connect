import { useEffect, useState } from "react";
import ModalShell from "@/components/ui/modal-shell";
import { subscribeConfirm, type ConfirmRequest } from "@/lib/confirm";

const SAFE_WORDS = /\b(publish|unlock|move|promote)\b/i;

/** Renders the dialog behind `confirmAction()`. Mount once near the app root. */
const ConfirmHost = () => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => subscribeConfirm((next) => {
    // A second request while one is open cancels the first rather than stacking.
    setRequest((current) => { current?.resolve(false); return next; });
  }), []);

  if (!request) return null;
  const destructive = request.destructive ?? !SAFE_WORDS.test(request.message);
  const finish = (accepted: boolean) => { request.resolve(accepted); setRequest(null); };

  return (
    <ModalShell
      onClose={() => finish(false)}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl outline-none"
    >
      <h2 className="font-heading text-lg font-bold">{request.title ?? (destructive ? "Are you sure?" : "Please confirm")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{request.message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => finish(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          {request.cancelLabel ?? "Cancel"}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => finish(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${destructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
        >
          {request.confirmLabel ?? (destructive ? "Yes, continue" : "Confirm")}
        </button>
      </div>
    </ModalShell>
  );
};

export default ConfirmHost;
