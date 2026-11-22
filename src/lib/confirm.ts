/**
 * Promise-based replacement for window.confirm. `<ConfirmHost />` (mounted once in App) shows the
 * styled dialog; callers just `await confirmAction("Delete this?")`.
 */
export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button. Defaults to true unless the message looks like a non-destructive action. */
  destructive?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
  message: string;
  resolve: (accepted: boolean) => void;
}

type Listener = (request: ConfirmRequest | null) => void;

let listener: Listener | null = null;

export const subscribeConfirm = (next: Listener) => {
  listener = next;
  return () => { if (listener === next) listener = null; };
};

export const confirmAction = (message: string, options: ConfirmOptions = {}): Promise<boolean> =>
  new Promise((resolve) => {
    // No host mounted (tests, early boot): fall back to the browser's own prompt.
    if (!listener) { resolve(typeof window !== "undefined" ? window.confirm(message) : false); return; }
    listener({ message, ...options, resolve });
  });
