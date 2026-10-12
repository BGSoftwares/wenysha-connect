import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
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

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI is not configured yet." }, 500);

  let body: { studentName?: string; className?: string; marks?: Mark[]; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const studentName = String(body.studentName ?? "").slice(0, 120).trim();
  const marks = Array.isArray(body.marks) ? body.marks.slice(0, 30) : [];
  const feedback = String(body.feedback ?? "").slice(0, 4000).trim();
  if (!studentName || (marks.length === 0 && !feedback)) {
    return json({ error: "Add the student's name and at least one mark or some feedback." }, 400);
  }

  const markLines = marks
    .filter((m) => m && m.subject)
    .map((m) => {
      const total = Number(m.total) || 100;
      const score = Number(m.score) || 0;
      return `- ${String(m.subject).slice(0, 60)}: ${score}/${total} (${Math.round((score / total) * 100)}%)`;
    })
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
