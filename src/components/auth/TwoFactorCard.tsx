import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MfaStatus = {
  mfa_enabled: boolean;
  mfa_method: "email" | "totp" | null;
  mfa_required: boolean;
  backup_codes_remaining: number;
  masked_email: string;
};
type TotpSetup = { secret: string; otpauth_uri: string; account: string };

/** Turn two-step verification (authenticator app) on or off and manage backup codes. */
export function TwoFactorCard() {
  const client = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["mfa-status"], queryFn: () => api.get<MfaStatus>("/auth/mfa/status/") });
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => client.invalidateQueries({ queryKey: ["mfa-status"] });

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () => run(async () => {
    setSetup(await api.post<TotpSetup>("/auth/mfa/totp/setup/", { password }));
    setPassword("");
  });

  const confirmSetup = () => run(async () => {
    const result = await api.post<{ backup_codes: string[] }>("/auth/mfa/totp/confirm/", { code });
    toast.success("Two-step verification is on.");
    setBackupCodes(result.backup_codes);
    setSetup(null);
    setCode("");
    await refresh();
  });

  const newBackupCodes = () => run(async () => {
    const result = await api.post<{ backup_codes: string[] }>("/auth/mfa/backup-codes/", { password });
    setBackupCodes(result.backup_codes);
    setPassword("");
    await refresh();
  });

  const turnOff = () => run(async () => {
    await api.post("/auth/mfa/toggle/", { enabled: false, password });
    toast.success("Two-step verification is off.");
    setPassword("");
    setBackupCodes(null);
    await refresh();
  });

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText((backupCodes ?? []).join("\n"));
      toast.success("Backup codes copied.");
    } catch {
      toast.error("Could not copy. Select the codes and copy them manually.");
    }
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Two-step verification</h3>

      {backupCodes && (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">Save your backup codes now</p>
          <p>If you lose your phone, each of these codes lets you sign in once. They are shown only this one time — store them somewhere safe (not on the same phone).</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-base" aria-label="Backup codes">
            {backupCodes.map((backup) => <li key={backup}>{backup}</li>)}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void copyCodes()}><Copy className="mr-2 h-4 w-4" />Copy</Button>
            <Button size="sm" variant="outline" onClick={() => setBackupCodes(null)}>I have saved them</Button>
          </div>
        </div>
      )}

      {status?.mfa_enabled ? (
        <>
          <p className="text-sm text-muted-foreground">
            On — signing in also needs a code from your {status.mfa_method === "totp" ? "authenticator app" : `email (${status.masked_email})`}.
            {" "}Backup codes left: {status.backup_codes_remaining}.
          </p>
          <label className="block text-sm">Current password
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy || !password} onClick={() => void newBackupCodes()}>Make new backup codes</Button>
            {status.mfa_required ? (
              <p className="self-center text-xs text-muted-foreground">Required for your role, so it cannot be turned off.</p>
            ) : (
              <Button variant="outline" disabled={busy || !password} onClick={() => void turnOff()}>Turn off</Button>
            )}
          </div>
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
          <p className="text-sm text-muted-foreground">
            {status?.mfa_required
              ? "Your role requires two-step verification. Set it up to continue."
              : "Add a second step to sign-in so a stolen password alone is not enough to open your account."}
          </p>
          <label className="block text-sm">Current password
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button variant="gold" disabled={busy || !password} onClick={() => void startSetup()}>Set up authenticator app</Button>
        </>
      )}
    </section>
  );
}
