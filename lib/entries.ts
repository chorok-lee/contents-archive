import { getDb } from "./db";
import { fromDateKey, toDateKey, todayKey } from "./dates";
import type { Mood } from "./moods";

export type EntryStatus = "read" | "to_read";

export interface ArticleFields {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: string | null;
  readingMinutes: number | null;
}

export interface EntryInput extends ArticleFields {
  summary: string;
  reflection: string;
  mood: Mood | null;
  status: EntryStatus;
  readOn: string;
  quotes: string[];
  tags: string[];
}

export interface Entry extends EntryInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface EntryRow {
  id: number;
  summary: string;
  reflection: string;
  mood: Mood | null;
  status: EntryStatus;
  read_on: string;
  created_at: string;
  updated_at: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  site_name: string | null;
  author: string | null;
  published_at: string | null;
  reading_minutes: number | null;
}

const SELECT_ENTRY = `
  SELECT e.id, e.summary, e.reflection, e.mood, e.status, e.read_on, e.created_at, e.updated_at,
         a.url, a.title, a.description, a.image, a.site_name, a.author, a.published_at, a.reading_minutes
  FROM entries e JOIN articles a ON a.id = e.article_id`;

function hydrate(rows: EntryRow[]): Entry[] {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");

  const quotes = db
    .prepare(
      `SELECT entry_id, text FROM quotes WHERE entry_id IN (${placeholders}) ORDER BY position`,
    )
    .all(...ids) as { entry_id: number; text: string }[];
  const tags = db
    .prepare(
      `SELECT et.entry_id, t.name FROM entry_tags et JOIN tags t ON t.id = et.tag_id
       WHERE et.entry_id IN (${placeholders}) ORDER BY t.name`,
    )
    .all(...ids) as { entry_id: number; name: string }[];

  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    description: r.description,
    image: r.image,
    siteName: r.site_name,
    author: r.author,
    publishedAt: r.published_at,
    readingMinutes: r.reading_minutes,
    summary: r.summary,
    reflection: r.reflection,
    mood: r.mood,
    status: r.status,
    readOn: r.read_on,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    quotes: quotes.filter((q) => q.entry_id === r.id).map((q) => q.text),
    tags: tags.filter((t) => t.entry_id === r.id).map((t) => t.name),
  }));
}

function upsertArticle(input: ArticleFields): number {
  const row = getDb()
    .prepare(
      `INSERT INTO articles (url, title, description, image, site_name, author, published_at, reading_minutes)
       VALUES (@url, @title, @description, @image, @siteName, @author, @publishedAt, @readingMinutes)
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         image = excluded.image,
         site_name = excluded.site_name,
         author = excluded.author,
         published_at = excluded.published_at,
         reading_minutes = excluded.reading_minutes
       RETURNING id`,
    )
    .get(input) as { id: number };
  return row.id;
}

function replaceQuotesAndTags(entryId: number, quotes: string[], tags: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM quotes WHERE entry_id = ?").run(entryId);
  const insertQuote = db.prepare(
    "INSERT INTO quotes (entry_id, text, position) VALUES (?, ?, ?)",
  );
  quotes.forEach((text, i) => insertQuote.run(entryId, text, i));

  db.prepare("DELETE FROM entry_tags WHERE entry_id = ?").run(entryId);
  const upsertTag = db.prepare(
    "INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name RETURNING id",
  );
  const linkTag = db.prepare(
    "INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)",
  );
  for (const name of tags) {
    const { id } = upsertTag.get(name) as { id: number };
    linkTag.run(entryId, id);
  }
  db.prepare(
    "DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM entry_tags)",
  ).run();
}

export function createEntry(input: EntryInput): number {
  const db = getDb();
  return db.transaction(() => {
    const articleId = upsertArticle(input);
    const { id } = db
      .prepare(
        `INSERT INTO entries (article_id, summary, reflection, mood, status, read_on)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .get(
        articleId,
        input.summary,
        input.reflection,
        input.mood,
        input.status,
        input.readOn,
      ) as { id: number };
    replaceQuotesAndTags(id, input.quotes, input.tags);
    return id;
  })();
}

export function updateEntry(id: number, input: EntryInput): void {
  const db = getDb();
  db.transaction(() => {
    const articleId = upsertArticle(input);
    db.prepare(
      `UPDATE entries SET article_id = ?, summary = ?, reflection = ?, mood = ?, status = ?, read_on = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      articleId,
      input.summary,
      input.reflection,
      input.mood,
      input.status,
      input.readOn,
      id,
    );
    replaceQuotesAndTags(id, input.quotes, input.tags);
  })();
}

export function deleteEntry(id: number): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare("DELETE FROM entries WHERE id = ?").run(id);
    db.prepare(
      "DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM entry_tags)",
    ).run();
  })();
}

export function getEntry(id: number): Entry | null {
  const row = getDb()
    .prepare(`${SELECT_ENTRY} WHERE e.id = ?`)
    .get(id) as EntryRow | undefined;
  return row ? hydrate([row])[0] : null;
}

export function findEntryIdByUrl(url: string): number | null {
  const row = getDb()
    .prepare(
      `SELECT e.id FROM entries e JOIN articles a ON a.id = e.article_id
       WHERE a.url = ? ORDER BY e.read_on DESC LIMIT 1`,
    )
    .get(url) as { id: number } | undefined;
  return row?.id ?? null;
}

export interface EntryFilter {
  q?: string;
  tag?: string;
  month?: string; // YYYY-MM
  status?: EntryStatus;
  limit?: number;
}

export function listEntries(filter: EntryFilter = {}): Entry[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter.q?.trim()) {
    // LIKE instead of FTS so that short Korean words (2 syllables) still match.
    const like = `%${filter.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(`(
      a.title LIKE ? ESCAPE '\\' OR a.description LIKE ? ESCAPE '\\' OR a.site_name LIKE ? ESCAPE '\\'
      OR e.summary LIKE ? ESCAPE '\\' OR e.reflection LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM quotes q WHERE q.entry_id = e.id AND q.text LIKE ? ESCAPE '\\')
      OR EXISTS (SELECT 1 FROM entry_tags et JOIN tags t ON t.id = et.tag_id
                 WHERE et.entry_id = e.id AND t.name LIKE ? ESCAPE '\\')
    )`);
    params.push(like, like, like, like, like, like, like);
  }
  if (filter.tag) {
    where.push(
      "EXISTS (SELECT 1 FROM entry_tags et JOIN tags t ON t.id = et.tag_id WHERE et.entry_id = e.id AND t.name = ?)",
    );
    params.push(filter.tag);
  }
  if (filter.month) {
    where.push("substr(e.read_on, 1, 7) = ?");
    params.push(filter.month);
  }
  if (filter.status) {
    where.push("e.status = ?");
    params.push(filter.status);
  }

  let sql = SELECT_ENTRY;
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += " ORDER BY e.read_on DESC, e.created_at DESC";
  if (filter.limit) {
    sql += " LIMIT ?";
    params.push(filter.limit);
  }

  return hydrate(getDb().prepare(sql).all(...params) as EntryRow[]);
}

export function listTags(): { name: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT t.name, COUNT(*) AS count FROM tags t JOIN entry_tags et ON et.tag_id = t.id
       GROUP BY t.id ORDER BY count DESC, t.name`,
    )
    .all() as { name: string; count: number }[];
}

export function listMonths(): string[] {
  return (
    getDb()
      .prepare(
        "SELECT DISTINCT substr(read_on, 1, 7) AS month FROM entries ORDER BY month DESC",
      )
      .all() as { month: string }[]
  ).map((r) => r.month);
}

export interface Activity {
  counts: Record<string, number>;
  streak: number;
  total: number;
  thisMonth: number;
}

/** Daily counts of finished reads, plus the current streak ending today or yesterday. */
export function getActivity(): Activity {
  const rows = getDb()
    .prepare(
      "SELECT read_on, COUNT(*) AS count FROM entries WHERE status = 'read' GROUP BY read_on",
    )
    .all() as { read_on: string; count: number }[];
  const counts = Object.fromEntries(rows.map((r) => [r.read_on, r.count]));

  const today = todayKey();
  const cursor = fromDateKey(today);
  if (!counts[today]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (counts[toDateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const month = today.slice(0, 7);
  return {
    counts,
    streak,
    total: rows.reduce((sum, r) => sum + r.count, 0),
    thisMonth: rows
      .filter((r) => r.read_on.startsWith(month))
      .reduce((sum, r) => sum + r.count, 0),
  };
}
