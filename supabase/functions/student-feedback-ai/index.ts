import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id, x-django-authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Mark = { subject: string; score: number; total: number };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const djangoApiBaseUrl = Deno.env.get("DJANGO_API_BASE_URL")?.replace(/\/+$/, "");
  const userAuthorization = req.headers.get("x-django-authorization");
  if (!djangoApiBaseUrl) return json({ error: "AI authorization is not configured." }, 503);
  if (!userAuthorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in with a teacher account to use the AI coach." }, 401);
  }

  let currentUser: { role?: string };
  try {
    const authResponse = await fetch(`${djangoApiBaseUrl}/auth/me/`, {
      headers: { Authorization: userAuthorization, Accept: "application/json" },
      signal: req.signal,
    });
    if (!authResponse.ok) {
      if (authResponse.status === 401) return json({ error: "Your session expired. Please sign in again." }, 401);
      if (authResponse.status === 403) return json({ error: "Your account cannot use the AI coach." }, 403);
      return json({ error: "Unable to verify your account right now." }, 503);
    }
    currentUser = await authResponse.json();
  } catch {
    if (req.signal.aborted) return json({ error: "Cancelled" }, 499);
    return json({ error: "Unable to reach the account service right now." }, 503);
  }
  if (String(currentUser.role ?? "").toLowerCase() !== "teacher") {
    return json({ error: "The AI coach is available to teachers only." }, 403);
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI is not configured yet." }, 500);

  let body: { studentName?: string; className?: string; marks?: unknown; feedback?: string };
  try {
    const parsedBody: unknown = await req.json();
    if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
      return json({ error: "Request must be a JSON object." }, 400);
    }
    body = parsedBody as typeof body;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const studentName = String(body.studentName ?? "").slice(0, 120).trim();
  if (body.marks !== undefined && !Array.isArray(body.marks)) {
    return json({ error: "Marks must be sent as a list." }, 400);
  }
  const rawMarks: unknown[] = Array.isArray(body.marks) ? body.marks : [];
  if (rawMarks.length > 30) return json({ error: "A maximum of 30 marks can be submitted." }, 400);
  const marks: Mark[] = [];
  for (const rawMark of rawMarks) {
    if (typeof rawMark !== "object" || rawMark === null) {
      return json({ error: "Each mark must include a subject, score, and total." }, 400);
    }
    const candidate = rawMark as Record<string, unknown>;
    const subject = typeof candidate.subject === "string" ? candidate.subject.trim().slice(0, 60) : "";
    const score = typeof candidate.score === "number" ? candidate.score : Number.NaN;
    const total = typeof candidate.total === "number" ? candidate.total : Number.NaN;
    if (!subject || !Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
      return json({ error: "Each mark needs a subject, a valid score, and a positive total; scores must be within the total." }, 400);
    }
    marks.push({ subject, score, total });
  }
  const feedback = String(body.feedback ?? "").slice(0, 4000).trim();
  if (!studentName || (marks.length === 0 && !feedback)) {
    return json({ error: "Add the student's name and at least one mark or some feedback." }, 400);
  }

  const markLines = marks
    .map((m) => `- ${m.subject}: ${m.score}/${m.total} (${Math.round((m.score / m.total) * 100)}%)`)
    .join("\n");

  const prompt = `Student: ${studentName}${body.className ? ` (${String(body.className).slice(0, 40)})` : ""}
Marks:
${markLines || "(none provided)"}

Teacher's assignment feedback:
${feedback || "(none provided)"}`;

  const instructions = `You are an encouraging, practical secondary-school academic coach in Zimbabwe (ZIMSEC curriculum).
Using the marks and teacher feedback, write personalised improvement suggestions addressed to the student.
Format in Markdown with these sections:
## Overall summary (2-3 sentences)
## Strengths
## Areas to improve (per weak subject, with the likely cause)
## Action plan (5-7 concrete, specific study steps for the next 2-4 weeks)
## Note for parents (1-2 sentences)
Be warm, specific and concise (under 400 words). Never invent marks that were not given.`;

  const runIdIn = req.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
  let runId = runIdIn;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
      return res;
    },
  });

  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: instructions,
      prompt,
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    if (!text.trim()) return json({ error: "The AI couldn't produce suggestions for this request." }, 422);
    const headers: Record<string, string> = {};
    if (runId) headers["X-Lovable-AIG-Run-ID"] = runId;
    return new Response(JSON.stringify({ suggestions: text }), {
      headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    const e = err as { statusCode?: number; message?: string; responseBody?: string };
    const status = e.statusCode ?? 500;
    if (req.signal.aborted) return json({ error: "Cancelled" }, 499);
    let message = "AI request failed. Please try again later.";
    if (status === 429) message = "Too many requests right now. Please wait a moment and try again.";
    else if (status === 402) message = "AI credits have run out. Add credits in workspace billing to continue.";
    else if (status === 403) message = "AI access is blocked for this workspace.";
    try {
      const parsed = JSON.parse(e.responseBody ?? "");
      if (parsed?.error?.message || parsed?.message) message = parsed.error?.message ?? parsed.message;
    } catch { /* ignore */ }
    console.error("student-feedback-ai error", status, e.message);
    return json({ error: message }, status >= 400 && status < 600 ? status : 500);
  }
});
