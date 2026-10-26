import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { KEYWORDS, ruleKeywords, type Keyword } from "./keywords";

const MODEL = "claude-opus-5-5";
// Long enough for any normal article; very long pages are summarized from their first part.
const MAX_BODY_CHARS = 60_000;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  client ??= new Anthropic();
  return client;
}

async function ask<T extends z.ZodType>(
  system: string,
  content: string,
  schema: T,
): Promise<z.infer<T> | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      // If the model declines, the API retries on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content }],
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (error) {
    console.error("[readlog] Claude API call failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

function articleBlock(title: string, body: string): string {
  const text = body.length > MAX_BODY_CHARS ? `${body.slice(0, MAX_BODY_CHARS)}\n…(이하 생략)` : body;
  return `<article>\n<title>${title}</title>\n<body>\n${text}\n</body>\n</article>`;
}

// ---------- summary ----------

const SummarySchema = z.object({ lines: z.array(z.string()) });

/** Splits text into sentences, keeping Korean "~다." / "~요." endings. */
function sentences(text: string): string[] {
  return (text.match(/[^.!?。\n]+[.!?。]?/g) ?? [])
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 15 && s.length <= 200);
}

export function ruleSummary(description: string | null, body: string): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const s of [...sentences(description ?? ""), ...sentences(body.slice(0, 5000))]) {
    const key = s.slice(0, 30);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(s);
    if (lines.length === 3) break;
  }
  return lines;
}

export async function summarize(
  title: string,
  description: string | null,
  body: string,
): Promise<{ lines: string[]; by: "ai" | "rule" }> {
  if (body.length >= 200) {
    const result = await ask(
      "You summarize articles for a Korean reader's reading log. Write at most 3 lines in Korean, " +
        "each a single complete sentence under 80 characters, covering the article's main point first. " +
        "Write in plain declarative style (~다). No bullets or numbering in the text.",
      articleBlock(title, body),
      SummarySchema,
    );
    const lines = result?.lines.map((l) => l.trim()).filter(Boolean).slice(0, 3);
    if (lines?.length) return { lines, by: "ai" };
  }
  return { lines: ruleSummary(description, body), by: "rule" };
}

// ---------- keywords ----------

const KeywordSchema = z.object({ keywords: z.array(z.enum(KEYWORDS)) });

export async function extractKeywords(
  title: string,
  body: string,
  reflection: string,
): Promise<Keyword[]> {
  const result = await ask(
    `Tag a reading-log entry with 1 to 3 categories from this fixed list: ${KEYWORDS.join(", ")}. ` +
      "Consider both the article and the reader's reflection; the reflection shows what the reader took from it. " +
      'Use "기타" only when nothing else fits.',
    `${articleBlock(title, body)}\n<reflection>\n${reflection}\n</reflection>`,
    KeywordSchema,
  );
  const keywords = [...new Set(result?.keywords ?? [])].slice(0, 3);
  return keywords.length ? keywords : ruleKeywords(`${title}\n${body}`, reflection);
}
