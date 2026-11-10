import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Section = { title: string; content: string };
export type AIResult = { ok: true; sections: Section[] } | { ok: false; error: string };

const PROMPTS = {
  meeting: `You are an expert meeting analyst. Analyse the meeting notes the user provides. Return JSON with this exact shape:
{"sections":[{"title":"Summary","content":"..."},{"title":"Key Decisions","content":"..."},{"title":"Action Items","content":"..."},{"title":"Owners & Deadlines","content":"..."},{"title":"Open Questions","content":"..."}]}
Use "- " bullet lines inside content where appropriate. For Action Items include owner and deadline when stated; write "Not specified" when missing. Never invent people, dates or facts not present in the notes.`,
  planner: `You are an expert productivity planner using the Eisenhower matrix. Given the user's tasks, priorities, deadlines and the requested planning horizon, return JSON with this exact shape:
{"sections":[{"title":"Priority Overview","content":"..."},{"title":"Schedule","content":"..."},{"title":"Deferred or Delegated","content":"..."},{"title":"Planning Notes","content":"..."}]}
In Schedule, use time blocks (daily) or day-by-day blocks (weekly) as "- " bullet lines, putting urgent and important work first, with realistic durations and breaks. Only use tasks the user provided.`,
  research: `You are a meticulous research analyst. Analyse the topic and/or source material the user provides. Return JSON with this exact shape:
{"sections":[{"title":"Summary","content":"..."},{"title":"Key Insights","content":"..."},{"title":"Important Findings","content":"..."},{"title":"Recommendations","content":"..."},{"title":"Limitations & Caveats","content":"..."}]}
Use "- " bullet lines where appropriate. When only a topic is given, rely on well-established knowledge and flag uncertainty. Do not fabricate statistics or citations.`,
} as const;

export const getAIStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env["LOVABLE_API_KEY"]) };
});

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ResearchAssistant" } });
    if (!res.ok) return `[Could not fetch ${url}: HTTP ${res.status}]`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 20000);
  } catch {
    return `[Could not fetch ${url}]`;
  }
}

export const runAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        tool: z.enum(["meeting", "planner", "research"]),
        input: z.string().min(1).max(60000),
        url: z.string().url().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<AIResult> => {
    if (!process.env["LOVABLE_API_KEY"]) {
      return { ok: false, error: "An AI API connection is required. No AI provider is configured for this app, so no results can be generated." };
    }
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    let userInput = data.input;
    if (data.url) {
      const page = await fetchUrlText(data.url);
      userInput += `\n\nContent fetched from ${data.url}:\n${page}`;
    }
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: PROMPTS[data.tool],
        input: [
          {
            role: "user",
            content: `${userInput}\n\nRespond with valid JSON only, matching the required shape.`,
          },
        ],
        text: { format: { type: "json_object" } },
      });
      let text = "";
      for (const item of (res as { output?: unknown[] }).output ?? []) {
        const content = (item as { content?: { type?: string; text?: string }[] }).content;
        for (const c of content ?? []) if (c.type === "output_text" && c.text) text += c.text;
      }
      const cleaned = text.replace(/^```(?:json)?|```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as { sections?: Section[] };
      const sections = (parsed.sections ?? []).filter((s) => s && typeof s.title === "string");
      if (!sections.length) return { ok: false, error: "The AI returned an empty response. Please try again." };
      return {
        ok: true,
        sections: sections.map((s) => ({ title: s.title, content: String(s.content ?? "") })),
      };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI gateway error", e.code, e.ids);
        if (e.httpStatus === 429) return { ok: false, error: "Too many requests right now. Please wait a moment and try again." };
        if (e.httpStatus === 402) return { ok: false, error: "AI credits are exhausted. Please add credits to continue." };
        return { ok: false, error: "The AI service couldn't complete this request. Please try again." };
      }
      console.error(e);
      return { ok: false, error: "Something went wrong while reading the AI response. Please try again." };
    }
  });
