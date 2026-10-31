import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import {
  ACCESS_TOKEN_KEY,
  AUTH_STATE_EVENT,
  clearAuth,
  getToken,
  INACTIVITY_LOGOUT_KEY,
  SESSION_ACTIVITY_KEY,
} from "@/lib/api";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 1000;
function readLastActivity(): number | null {
  const value = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Sign out an authenticated browser session after ten minutes without input. */
export function useInactivityLogout(): void {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: number | undefined;
    let lastActivityWrite = 0;

    const cancelTimer = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const expireSession = () => {
      if (!getToken()) return;

      const lastActivity = readLastActivity();
      if (lastActivity !== null && Date.now() - lastActivity < INACTIVITY_TIMEOUT_MS) {
        scheduleTimeout();
        return;
      }

      localStorage.setItem(INACTIVITY_LOGOUT_KEY, String(Date.now()));
      clearAuth();
      toast.info("You were logged out after 10 minutes of inactivity.");
      navigate("/", { replace: true });
    };

    const scheduleTimeout = () => {
      cancelTimer();
      if (!getToken()) return;

      let lastActivity = readLastActivity();
      if (lastActivity === null) {
        lastActivity = Date.now();
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(lastActivity));
      }

      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);
      timeoutId = window.setTimeout(expireSession, Math.max(0, remaining));
    };

    const recordActivity = () => {
      if (!getToken()) return;

      const now = Date.now();
      if (now - lastActivityWrite >= ACTIVITY_WRITE_INTERVAL_MS) {
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
        lastActivityWrite = now;
      }
      scheduleTimeout();
    };

    const handleAuthStateChange = () => {
      if (getToken()) {
        const now = Date.now();
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
        lastActivityWrite = now;
        scheduleTimeout();
      } else {
        cancelTimer();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SESSION_ACTIVITY_KEY) {
        scheduleTimeout();
        return;
      }

      if (event.key === ACCESS_TOKEN_KEY && event.newValue === null) {
        cancelTimer();
        clearAuth();
        navigate("/", { replace: true });

        const logoutAt = Number(localStorage.getItem(INACTIVITY_LOGOUT_KEY));
        if (Number.isFinite(logoutAt) && Date.now() - logoutAt < 60_000) {
          toast.info("You were logged out after 10 minutes of inactivity.");
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleTimeout();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener(AUTH_STATE_EVENT, handleAuthStateChange);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleTimeout();

    return () => {
      cancelTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthStateChange);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);
}
