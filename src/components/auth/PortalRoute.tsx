import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, clearAuth, getErrorMessage, getStoredUser, getToken } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/portalRoles";

interface AuthenticatedUser {
  role?: string | null;
}

export function PortalRoute({ role, children }: { role: string; children: ReactElement }) {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "allowed" | "redirect" | "unauthenticated" | "error">("checking");
  const [destination, setDestination] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [errorMessage, setErrorMessage] = useState("We couldn’t verify your portal access. Check your connection and try again.");

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }

    api.get<AuthenticatedUser>("/auth/me/").then((user) => {
      if (!active) return;
      const userDashboard = dashboardPathForRole(user.role);
      const requestedDashboard = dashboardPathForRole(role);
      if (!userDashboard) {
        clearAuth();
        setStatus("unauthenticated");
      } else if (userDashboard === requestedDashboard) {
        setStatus("allowed");
      } else {
        setDestination(userDashboard);
        setStatus("redirect");
      }
    }).catch((error: unknown) => {
      if (!active) return;
      const detail = typeof error === "object" && error !== null && "detail" in error
        ? String((error as { detail?: unknown }).detail ?? "") : "";
      if (/token|credential|authentication/i.test(detail)) {
        clearAuth();
        setStatus("unauthenticated");
      } else if (/not found|404/i.test(detail)) {
        // Older deployed API instances may not yet expose /auth/me/. Login
        // itself is still authenticated server-side, so use its cached role
        // only for this compatibility case until the backend is restarted.
        const cachedDashboard = dashboardPathForRole(getStoredUser()?.role);
        const requestedDashboard = dashboardPathForRole(role);
        if (!cachedDashboard) {
          clearAuth();
          setStatus("unauthenticated");
        } else if (cachedDashboard === requestedDashboard) {
          setStatus("allowed");
        } else {
          setDestination(cachedDashboard);
          setStatus("redirect");
        }
      } else {
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    });
    return () => { active = false; };
  }, [role, retry]);

  if (status === "checking") {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground" aria-live="polite">Verifying your portal access…</div>;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  if (status === "redirect" && destination) return <Navigate to={destination} replace />;
  if (status === "error") {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-foreground">{errorMessage}</p>
      <button className="text-primary underline" onClick={() => { setStatus("checking"); setRetry((value) => value + 1); }}>Try again</button>
    </div>;
  }
  return children;
}
