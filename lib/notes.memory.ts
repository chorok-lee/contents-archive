/**
 * In-memory store with the same API as notes.supabase.ts. Development only
 * (READLOG_FAKE_DB=1): data lives in the server process and is lost on restart.
 */
import { KEYWORDS, type Keyword } from "./keywords";
import type { Article, Note } from "./notes.supabase";

interface NoteRecord {
  id: number;
  articleId: number;
  reflection: string;
  createdAt: string;
  updatedAt: string;
  keywords: Keyword[];
}

declare global {
  var __readlogMemory: { articles: Article[]; notes: NoteRecord[]; seq: number } | undefined;
}

const db = (globalThis.__readlogMemory ??= { articles: [], notes: [], seq: 0 });

function toNote(n: NoteRecord): Note {
  const a = db.articles.find((x) => x.id === n.articleId)!;
  const article = {
    id: a.id,
    url: a.url,
    title: a.title,
    siteName: a.siteName,
    image: a.image,
    description: a.description,
    summary: a.summary,
    summarizedBy: a.summarizedBy,
  };
  return {
    id: n.id,
    reflection: n.reflection,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    keywords: KEYWORDS.filter((k) => n.keywords.includes(k)),
    article,
  };
}

export async function getArticleByUrl(url: string) {
  return db.articles.find((a) => a.url === url) ?? null;
}

export async function getArticle(id: number) {
  return db.articles.find((a) => a.id === id) ?? null;
}

export async function saveArticle(input: Omit<Article, "id">): Promise<Article> {
  const fetchedAt = new Date().toISOString();
  const existing = db.articles.find((a) => a.url === input.url);
  if (existing) return Object.assign(existing, input, { fetchedAt });
  const article = { ...input, fetchedAt, id: ++db.seq };
  db.articles.push(article);
  return article;
}

export async function createNote(articleId: number, reflection: string, keywords: Keyword[]) {
  const now = new Date().toISOString();
  const id = ++db.seq;
  db.notes.push({ id, articleId, reflection, createdAt: now, updatedAt: now, keywords });
  return id;
}

export async function updateNote(id: number, reflection: string, keywords: Keyword[]) {
  const note = db.notes.find((n) => n.id === id);
  if (note) Object.assign(note, { reflection, keywords, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: number) {
  db.notes = db.notes.filter((n) => n.id !== id);
}

export async function getNote(id: number) {
  const note = db.notes.find((n) => n.id === id);
  return note ? toNote(note) : null;
}

export async function listNotes(keyword?: Keyword) {
  return db.notes
    .filter((n) => !keyword || n.keywords.includes(keyword))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map(toNote);
}

export async function keywordCounts() {
  return KEYWORDS.flatMap((keyword) => {
    const count = db.notes.filter((n) => n.keywords.includes(keyword)).length;
    return count ? [{ keyword, count }] : [];
  });
}

export async function findNoteIdByUrl(url: string) {
  const article = db.articles.find((a) => a.url === url);
  const notes = db.notes.filter((n) => n.articleId === article?.id);
  return notes.at(-1)?.id ?? null;
}
