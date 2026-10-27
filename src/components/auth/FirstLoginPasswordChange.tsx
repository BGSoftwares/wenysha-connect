import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FirstLoginPasswordChange({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters for your new password.");
    if (password !== confirmPassword) return setError("The passwords do not match.");
    setSaving(true);
    try {
      await api.post("/auth/change-password/", { new_password: password, confirm_password: confirmPassword });
      onComplete();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><KeyRound className="h-5 w-5" /></span><div><h1 className="text-xl font-bold">Set your new password</h1><p className="mt-1 text-sm text-muted-foreground">For your security, change the temporary password before opening your portal.</p></div></div>
        <label className="block text-sm">New password<Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="block text-sm">Confirm new password<Input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button className="w-full" variant="gold" disabled={saving || password.length < 8 || !confirmPassword} onClick={() => void submit()}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Change password and continue"}</Button>
      </section>
    </main>
  );
}
