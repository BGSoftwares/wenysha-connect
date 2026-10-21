import { getToken } from "@/lib/api";

/** Invoke a Lovable Cloud function without exposing its server-side AI key. */
export async function invokeSupabaseFunction<T>(functionName: string, body: unknown): Promise<T> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("AI is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  const accessToken = getToken();
  if (!accessToken) throw new Error("Please sign in again to use the AI coach.");

  const response = await fetch(`${url.replace(/\/+$/, "")}/functions/v1/${encodeURIComponent(functionName)}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      "x-django-authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
      ? data.error
      : `AI request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }
  return data as T;
}
