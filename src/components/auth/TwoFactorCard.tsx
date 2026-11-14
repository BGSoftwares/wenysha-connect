import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MfaStatus = { mfa_enabled: boolean; mfa_method: "email" | "totp" | null; masked_email: string };
type TotpSetup = { secret: string; otpauth_uri: string; account: string };

/** Turn two-step verification (authenticator app) on or off. */
export function TwoFactorCard() {
  const client = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["mfa-status"], queryFn: () => api.get<MfaStatus>("/auth/mfa/status/") });
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => client.invalidateQueries({ queryKey: ["mfa-status"] });

  const startSetup = async () => {
    setBusy(true);
    try {
      setSetup(await api.post<TotpSetup>("/auth/mfa/totp/setup/", { password }));
      setPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    setBusy(true);
    try {
      await api.post("/auth/mfa/totp/confirm/", { code });
      toast.success("Two-step verification is on.");
      setSetup(null);
      setCode("");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await api.post("/auth/mfa/toggle/", { enabled: false, password });
      toast.success("Two-step verification is off.");
      setPassword("");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Two-step verification</h3>

      {status?.mfa_enabled ? (
        <>
          <p className="text-sm text-muted-foreground">
            On — signing in also needs a code from your {status.mfa_method === "totp" ? "authenticator app" : `email (${status.masked_email})`}.
          </p>
          <label className="block text-sm">Current password
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button variant="outline" disabled={busy || !password} onClick={() => void turnOff()}>Turn off</Button>
        </>
      ) : setup ? (
        <>
          <p className="text-sm text-muted-foreground">
            In your authenticator app (Google Authenticator, Microsoft Authenticator, Authy…) choose “Enter a setup key” and add this key, then type the 6-digit code it shows.
          </p>
          <code className="block break-all rounded-lg bg-secondary/60 p-3 text-sm tracking-wider">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code>
          <label className="block text-sm">6-digit code
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button variant="gold" disabled={busy || code.replace(/\D/g, "").length !== 6} onClick={() => void confirmSetup()}>Verify and turn on</Button>
            <Button variant="outline" disabled={busy} onClick={() => { setSetup(null); setCode(""); }}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Add a second step to sign-in so a stolen password alone is not enough to open your account.</p>
          <label className="block text-sm">Current password
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button variant="gold" disabled={busy || !password} onClick={() => void startSetup()}>Set up authenticator app</Button>
        </>
      )}
    </section>
  );
}
