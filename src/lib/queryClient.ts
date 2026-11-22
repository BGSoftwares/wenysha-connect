import { QueryClient } from "@tanstack/react-query";

/** A 4xx answer means the request itself is wrong, so retrying only makes screens hang. */
const shouldRetry = (failureCount: number, error: unknown) => {
  const status = (error as { response?: { status?: number }; status?: number })?.response?.status
    ?? (error as { status?: number })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) return false;
  return failureCount < 1;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show data already fetched for 30s instead of re-requesting on every mount.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
  },
});

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "ablegodcollege_user") queryClient.clear();
  });
}
