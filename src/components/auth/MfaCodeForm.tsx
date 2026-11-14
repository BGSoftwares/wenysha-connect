import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage, resendMfaCode, verifyMfa } from "@/lib/api";
import type { LoginResponse, MfaChallenge } from "@/lib/api";

interface MfaCodeFormProps {
  challenge: MfaChallenge;
  onVerified: (data: LoginResponse) => void;
  onCancel: () => void;
}

/** Second step of sign-in: enter the 6-digit code from the authenticator app or email. */
export function MfaCodeForm({ challenge, onVerified, onCancel }: MfaCodeFormProps) {
  const [token, setToken] = useState(challenge.mfa_token);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const isEmail = challenge.mfa_method === "email";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onVerified(await verifyMfa(token, code));
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const result = await resendMfaCode(token);
      setToken(result.mfa_token);
      toast.success(result.detail);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 text-sm text-slate-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          {isEmail
            ? `Enter the 6-digit code we emailed to ${challenge.masked_destination ?? "your address"}.`
            : "Enter the 6-digit code shown in your authenticator app."}
        </p>
      </div>
      <input
        required
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        placeholder="123456"
        aria-label="Verification code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-blue-50 py-3 text-center text-2xl tracking-[0.4em] text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
      />
      <Button type="submit" disabled={busy || code.replace(/\D/g, "").length !== 6} variant="gold" className="h-11 w-full rounded-xl text-base font-bold">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify and sign in"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onCancel} className="font-medium text-primary hover:underline">Back to sign in</button>
        {isEmail && (
          <button type="button" disabled={resending} onClick={() => void resend()} className="font-medium text-primary hover:underline disabled:opacity-50">
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </form>
  );
}
