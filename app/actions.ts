"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { aiAvailable, extractKeywords, summarize } from "@/lib/ai";
import { fetchArticle, normalizeUrl, type FetchFailure } from "@/lib/extract";
import {
  createNote,
  deleteNote,
  findNoteIdByUrl,
  getArticle,
  getArticleByUrl,
  getNote,
  saveArticle,
  updateNote,
  type Article,
} from "@/lib/notes";

export type AnalyzeResult =
  | {
      ok: true;
      article: Pick<Article, "id" | "url" | "title" | "siteName" | "image">;
      summary: string[];
      /** Why the page couldn't be read, if it couldn't. */
      failure: FetchFailure | null;
      existingNoteId: number | null;
    }
  | { ok: false; error: string };

// Pages fetched before the extractor last changed are fetched again.
const EXTRACTOR_UPDATED_AT = "2026-11-05T15:25:00Z";

function isFresh(article: Article): boolean {
  if (!article.bodyText) return false;
  if (!article.fetchedAt || article.fetchedAt < EXTRACTOR_UPDATED_AT) return false;
  // A rule-based summary is redone once an API key is configured.
  return article.summarizedBy === "ai" || !aiAvailable();
}

async function loadArticle(url: string): Promise<{ article: Article; failure: FetchFailure | null }> {
  const cached = await getArticleByUrl(url);
  if (cached && isFresh(cached)) return { article: cached, failure: null };

  const fetched = await fetchArticle(url);
  if (typeof fetched === "string") {
    // A temporary failure keeps the earlier copy; a login wall means that copy wasn't the article.
    const keepCached = cached && fetched !== "login";
    const article = keepCached
      ? cached
      : await saveArticle({
        url,
        title: new URL(url).hostname.replace(/^www\./, ""),
        siteName: null,
        image: null,
        description: null,
        bodyText: "",
        summary: [],
        summarizedBy: "rule",
      });
    return { article, failure: fetched };
  }

  const { lines, by } = await summarize(fetched.title, fetched.description, fetched.bodyText);
  console.info(`[readlog] analyze ${new URL(url).hostname} bodyChars=${fetched.bodyText.length} by=${by}`);
  const article = await saveArticle({ ...fetched, summary: lines, summarizedBy: by });
  return { article, failure: null };
}

function errorMessage(error: unknown): string {
  console.error("[readlog]", error);
  return error instanceof Error ? error.message : "알 수 없는 오류가 났어요.";
}

export async function analyzeUrl(raw: string): Promise<AnalyzeResult> {
  const url = normalizeUrl(raw);
  if (!url) return { ok: false, error: "올바른 URL이 아니에요. 주소를 다시 확인해 주세요." };
  try {
    return await analyze(url);
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function analyze(url: string): Promise<AnalyzeResult> {
  const { article, failure } = await loadArticle(url);
  return {
    ok: true,
    article: {
      id: article.id,
      url: article.url,
      title: article.title,
      siteName: article.siteName,
      image: article.image,
    },
    summary: article.summary,
    failure,
    existingNoteId: await findNoteIdByUrl(url),
  };
}

export async function saveNote(
  articleId: number,
  reflection: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const text = reflection.trim();
  if (!text) return { ok: false, error: "느낀 점을 한 줄이라도 적어 주세요." };
  try {
    const article = await getArticle(articleId);
    if (!article) return { ok: false, error: "글 정보를 찾지 못했어요. URL을 다시 붙여넣어 주세요." };

    const keywords = await extractKeywords(article.title, article.bodyText || (article.description ?? ""), text);
    const id = await createNote(article.id, text, keywords);
    revalidatePath("/");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateReflection(
  id: number,
  reflection: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = reflection.trim();
  if (!text) return { ok: false, error: "느낀 점이 비어 있어요." };
  try {
    const note = await getNote(id);
    if (!note) return { ok: false, error: "기록을 찾지 못했어요." };

    const article = await getArticle(note.article.id);
    const keywords = await extractKeywords(
      note.article.title,
      article?.bodyText || (note.article.description ?? ""),
      text,
    );
    await updateNote(id, text, keywords);
    revalidatePath("/");
    revalidatePath(`/notes/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function removeNote(id: number): Promise<void> {
  await deleteNote(id);
  revalidatePath("/");
  redirect("/");
}
