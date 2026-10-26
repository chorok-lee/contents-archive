import { getDb } from "./db";
import { isKeyword, KEYWORDS, type Keyword } from "./keywords";

export interface Article {
  id: number;
  url: string;
  title: string;
  siteName: string | null;
  image: string | null;
  description: string | null;
  bodyText: string;
  summary: string[];
  summarizedBy: "ai" | "rule";
}

export interface Note {
  id: number;
  reflection: string;
  createdAt: string;
  updatedAt: string;
  keywords: Keyword[];
  article: Omit<Article, "bodyText">;
}

interface ArticleRow {
  id: number;
  url: string;
  title: string;
  site_name: string | null;
  image: string | null;
  description: string | null;
  body_text: string;
  summary: string;
  summarized_by: "ai" | "rule";
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    siteName: row.site_name,
    image: row.image,
    description: row.description,
    bodyText: row.body_text,
    summary: JSON.parse(row.summary) as string[],
    summarizedBy: row.summarized_by,
  };
}

export function getArticleByUrl(url: string): Article | null {
  const row = getDb()
    .prepare("SELECT * FROM articles WHERE url = ?")
    .get(url) as ArticleRow | undefined;
  return row ? toArticle(row) : null;
}

export function getArticle(id: number): Article | null {
  const row = getDb()
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(id) as ArticleRow | undefined;
  return row ? toArticle(row) : null;
}

export function saveArticle(input: Omit<Article, "id">): Article {
  const row = getDb()
    .prepare(
      `INSERT INTO articles (url, title, site_name, image, description, body_text, summary, summarized_by, fetched_at)
       VALUES (@url, @title, @siteName, @image, @description, @bodyText, @summary, @summarizedBy, @fetchedAt)
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title, site_name = excluded.site_name, image = excluded.image,
         description = excluded.description, body_text = excluded.body_text,
         summary = excluded.summary, summarized_by = excluded.summarized_by, fetched_at = excluded.fetched_at
       RETURNING *`,
    )
    .get({
      ...input,
      summary: JSON.stringify(input.summary),
      fetchedAt: new Date().toISOString(),
    }) as ArticleRow;
  return toArticle(row);
}

function setKeywords(noteId: number, keywords: Keyword[]) {
  const db = getDb();
  db.prepare("DELETE FROM note_keywords WHERE note_id = ?").run(noteId);
  const insert = db.prepare("INSERT OR IGNORE INTO note_keywords (note_id, keyword) VALUES (?, ?)");
  for (const k of keywords) insert.run(noteId, k);
}

export function createNote(articleId: number, reflection: string, keywords: Keyword[]): number {
  const db = getDb();
  return db.transaction(() => {
    const now = new Date().toISOString();
    const { id } = db
      .prepare(
        "INSERT INTO notes (article_id, reflection, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING id",
      )
      .get(articleId, reflection, now, now) as { id: number };
    setKeywords(id, keywords);
    return id;
  })();
}

export function updateNote(id: number, reflection: string, keywords: Keyword[]): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE notes SET reflection = ?, updated_at = ? WHERE id = ?").run(
      reflection,
      new Date().toISOString(),
      id,
    );
    setKeywords(id, keywords);
  })();
}

export function deleteNote(id: number): void {
  getDb().prepare("DELETE FROM notes WHERE id = ?").run(id);
}

interface NoteRow {
  id: number;
  reflection: string;
  created_at: string;
  updated_at: string;
  article_id: number;
  url: string;
  title: string;
  site_name: string | null;
  image: string | null;
  description: string | null;
  summary: string;
  summarized_by: "ai" | "rule";
}

const SELECT_NOTE = `
  SELECT n.id, n.reflection, n.created_at, n.updated_at, n.article_id,
         a.url, a.title, a.site_name, a.image, a.description, a.summary, a.summarized_by
  FROM notes n JOIN articles a ON a.id = n.article_id`;

function hydrate(rows: NoteRow[]): Note[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const keywordRows = getDb()
    .prepare(
      `SELECT note_id, keyword FROM note_keywords WHERE note_id IN (${ids.map(() => "?").join(",")})`,
    )
    .all(...ids) as { note_id: number; keyword: string }[];

  return rows.map((r) => ({
    id: r.id,
    reflection: r.reflection,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    keywords: KEYWORDS.filter((k) =>
      keywordRows.some((kr) => kr.note_id === r.id && kr.keyword === k),
    ),
    article: {
      id: r.article_id,
      url: r.url,
      title: r.title,
      siteName: r.site_name,
      image: r.image,
      description: r.description,
      summary: JSON.parse(r.summary) as string[],
      summarizedBy: r.summarized_by,
    },
  }));
}

export function getNote(id: number): Note | null {
  const row = getDb().prepare(`${SELECT_NOTE} WHERE n.id = ?`).get(id) as NoteRow | undefined;
  return row ? hydrate([row])[0] : null;
}

/** Newest first, optionally limited to one keyword. */
export function listNotes(keyword?: Keyword): Note[] {
  const rows = keyword
    ? getDb()
        .prepare(
          `${SELECT_NOTE} WHERE EXISTS (SELECT 1 FROM note_keywords k WHERE k.note_id = n.id AND k.keyword = ?)
           ORDER BY n.created_at DESC`,
        )
        .all(keyword)
    : getDb().prepare(`${SELECT_NOTE} ORDER BY n.created_at DESC`).all();
  return hydrate(rows as NoteRow[]);
}

/** Keywords that have at least one note, in the fixed chip order. */
export function keywordCounts(): { keyword: Keyword; count: number }[] {
  const rows = getDb()
    .prepare("SELECT keyword, COUNT(*) AS count FROM note_keywords GROUP BY keyword")
    .all() as { keyword: string; count: number }[];
  return KEYWORDS.flatMap((keyword) => {
    const row = rows.find((r) => r.keyword === keyword && isKeyword(r.keyword));
    return row ? [{ keyword, count: row.count }] : [];
  });
}

export function findNoteIdByUrl(url: string): number | null {
  const row = getDb()
    .prepare(
      `SELECT n.id FROM notes n JOIN articles a ON a.id = n.article_id
       WHERE a.url = ? ORDER BY n.created_at DESC LIMIT 1`,
    )
    .get(url) as { id: number } | undefined;
  return row?.id ?? null;
}
