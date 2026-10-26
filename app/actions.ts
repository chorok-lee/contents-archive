"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractKeywords, summarize } from "@/lib/ai";
import { fetchArticle, normalizeUrl } from "@/lib/extract";
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
      fetchFailed: boolean;
      existingNoteId: number | null;
    }
  | { ok: false; error: string };

async function loadArticle(url: string): Promise<{ article: Article; fetchFailed: boolean }> {
  const cached = getArticleByUrl(url);
  if (cached?.bodyText) return { article: cached, fetchFailed: false };

  const fetched = await fetchArticle(url);
  if (!fetched) {
    const fallback =
      cached ??
      saveArticle({
        url,
        title: new URL(url).hostname.replace(/^www\./, ""),
        siteName: null,
        image: null,
        description: null,
        bodyText: "",
        summary: [],
        summarizedBy: "rule",
      });
    return { article: fallback, fetchFailed: true };
  }

  const { lines, by } = await summarize(fetched.title, fetched.description, fetched.bodyText);
  const article = saveArticle({ ...fetched, summary: lines, summarizedBy: by });
  return { article, fetchFailed: false };
}

export async function analyzeUrl(raw: string): Promise<AnalyzeResult> {
  const url = normalizeUrl(raw);
  if (!url) return { ok: false, error: "올바른 URL이 아니에요. 주소를 다시 확인해 주세요." };

  const { article, fetchFailed } = await loadArticle(url);
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
    fetchFailed,
    existingNoteId: findNoteIdByUrl(url),
  };
}

export async function saveNote(
  articleId: number,
  reflection: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const text = reflection.trim();
  if (!text) return { ok: false, error: "느낀 점을 한 줄이라도 적어 주세요." };
  const article = getArticle(articleId);
  if (!article) return { ok: false, error: "글 정보를 찾지 못했어요. URL을 다시 붙여넣어 주세요." };

  const keywords = await extractKeywords(article.title, article.bodyText || (article.description ?? ""), text);
  const id = createNote(article.id, text, keywords);
  revalidatePath("/archive");
  return { ok: true, id };
}

export async function updateReflection(
  id: number,
  reflection: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = reflection.trim();
  if (!text) return { ok: false, error: "느낀 점이 비어 있어요." };
  const note = getNote(id);
  if (!note) return { ok: false, error: "기록을 찾지 못했어요." };

  const article = getArticle(note.article.id);
  const keywords = await extractKeywords(
    note.article.title,
    article?.bodyText || (note.article.description ?? ""),
    text,
  );
  updateNote(id, text, keywords);
  revalidatePath("/archive");
  revalidatePath(`/notes/${id}`);
  return { ok: true };
}

export async function removeNote(id: number): Promise<void> {
  deleteNote(id);
  revalidatePath("/archive");
  redirect("/archive");
}
