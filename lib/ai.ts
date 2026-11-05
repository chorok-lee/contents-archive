import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { KEYWORDS, ruleKeywords, type Keyword } from "./keywords";

const MODEL = "claude-opus-5-5";
// Long enough for any normal article; very long pages are summarized from their first part.
const MAX_BODY_CHARS = 60_000;

let client: Anthropic | null = null;

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function getClient(): Anthropic | null {
  if (!aiAvailable()) return null;
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
    .filter((s) => s.length >= 20 && s.length <= 180);
}

// Bylines, dates, share/subscribe prompts and similar lines that aren't the article.
const NOISE = /(구독|좋아요|댓글|공유하기|저작권|무단|All rights|Copyright|\d{4}[.\-/]\s?\d{1,2}[.\-/]\s?\d{1,2}|^\s*(by|글|사진)\s)/i;

/** Rough stem: Korean words lose a trailing particle-length syllable, others are lowercased. */
function stems(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((w) => w.length >= 2)
    .map((w) => (/[\uac00-\ud7a3]/.test(w) && w.length >= 3 ? w.slice(0, -1) : w));
}

function overlaps(a: string, b: string): boolean {
  const sa = new Set(stems(a));
  const sb = stems(b);
  if (!sb.length) return false;
  return sb.filter((w) => sa.has(w)).length / sb.length > 0.6;
}

/**
 * Summary without an API key: the three sentences whose words recur most across the
 * article (a classic frequency summary), kept in reading order.
 */
export function ruleSummary(description: string | null, body: string): string[] {
  const candidates = sentences(body.slice(0, 20_000)).filter((s) => !NOISE.test(s));
  const freq = new Map<string, number>();
  for (const s of candidates) for (const w of new Set(stems(s))) freq.set(w, (freq.get(w) ?? 0) + 1);

  const scored = candidates.map((s, i) => {
    const words = stems(s);
    const score = words.reduce((sum, w) => sum + ((freq.get(w) ?? 1) - 1), 0) / Math.sqrt(words.length || 1);
    return { s, i, score };
  });

  const picked: { s: string; i: number }[] = [];
  const intro = sentences(description ?? "").find((d) => !NOISE.test(d));
  if (intro) picked.push({ s: intro, i: -1 });
  for (const c of [...scored].sort((a, b) => b.score - a.score)) {
    if (picked.length === 3) break;
    if (picked.some((p) => overlaps(p.s, c.s) || overlaps(c.s, p.s))) continue;
    picked.push(c);
  }
  return picked.sort((a, b) => a.i - b.i).map((p) => p.s);
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
