import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TwoFactorCard } from "@/components/auth/TwoFactorCard";
import { api, clearAuth, revokeSession } from "@/lib/api";

/**
 * Full-screen step shown to roles that must use two-step verification but have
 * not set it up yet. Continue unlocks once the server reports it as enabled, so
 * the person has had the chance to save their backup codes first.
 */
export function MfaSetupGate({ onComplete }: { onComplete: () => void }) {
  const { data } = useQuery({ queryKey: ["mfa-status"], queryFn: () => api.get<{ mfa_enabled: boolean }>("/auth/mfa/status/") });

  const signOut = () => {
    revokeSession();
    clearAuth();
    window.location.assign("/auth");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Secure your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Two-step verification is required for your role before you can use the portal.</p>
        </div>
        <TwoFactorCard />
        <Button variant="gold" className="w-full" disabled={!data?.mfa_enabled} onClick={onComplete}>Continue to portal</Button>
        <button type="button" onClick={signOut} className="w-full text-center text-sm text-primary hover:underline">Sign out</button>
      </div>
    </div>
  );
}
