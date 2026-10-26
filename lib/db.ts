import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { ruleKeywords } from "./keywords";

const DB_PATH =
  process.env.READLOG_DB ?? path.join(process.cwd(), "data", "readlog.db");

const SCHEMA_VERSION = 2;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS articles (
  id            INTEGER PRIMARY KEY,
  url           TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  site_name     TEXT,
  image         TEXT,
  description   TEXT,
  body_text     TEXT NOT NULL DEFAULT '',
  summary       TEXT NOT NULL DEFAULT '[]', -- JSON string[]
  summarized_by TEXT NOT NULL DEFAULT 'rule' CHECK (summarized_by IN ('ai', 'rule')),
  fetched_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY,
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reflection  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notes_created_at ON notes(created_at);

CREATE TABLE IF NOT EXISTS note_keywords (
  note_id  INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  keyword  TEXT NOT NULL,
  PRIMARY KEY (note_id, keyword)
);
CREATE INDEX IF NOT EXISTS note_keywords_keyword ON note_keywords(keyword);
`;

declare global {
  var __readlogDb: Database.Database | undefined;
}

function tableExists(db: Database.Database, name: string): boolean {
  return Boolean(
    db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name),
  );
}

/**
 * Carries v1 (MVP) records over: each entry becomes a note whose reflection is the old
 * reflection, or the one-line summary when that was all that was written. Entries with
 * neither (unread "to read" items) are dropped, as are moods, quotes and free-form tags;
 * keywords are re-derived with the rule-based matcher.
 */
function migrateFromV1(db: Database.Database) {
  db.exec("ALTER TABLE articles RENAME TO articles_v1");
  db.exec(SCHEMA);
  db.exec(`
    INSERT INTO articles (id, url, title, site_name, image, description, fetched_at)
    SELECT id, url, title, site_name, image, description, replace(created_at, ' ', 'T') || 'Z'
    FROM articles_v1;

    INSERT INTO notes (id, article_id, reflection, created_at, updated_at)
    SELECT id, article_id,
           CASE WHEN trim(reflection) <> '' THEN trim(reflection) ELSE trim(summary) END,
           replace(created_at, ' ', 'T') || 'Z', replace(updated_at, ' ', 'T') || 'Z'
    FROM entries
    WHERE trim(reflection) <> '' OR trim(summary) <> '';
  `);
  const notes = db
    .prepare(
      `SELECT n.id, n.reflection, a.title, coalesce(a.description, '') AS description
       FROM notes n JOIN articles a ON a.id = n.article_id`,
    )
    .all() as { id: number; reflection: string; title: string; description: string }[];
  const insertKeyword = db.prepare("INSERT INTO note_keywords (note_id, keyword) VALUES (?, ?)");
  for (const n of notes) {
    for (const k of ruleKeywords(`${n.title}\n${n.description}`, n.reflection)) insertKeyword.run(n.id, k);
  }
  for (const table of ["entry_tags", "tags", "quotes", "entries", "articles_v1"]) {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  }
}

function migrate(db: Database.Database) {
  const version = db.pragma("user_version", { simple: true }) as number;
  if (version >= SCHEMA_VERSION) return;
  db.transaction(() => {
    if (version < 2 && tableExists(db, "entries")) {
      migrateFromV1(db);
    } else {
      db.exec(SCHEMA);
    }
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  })();
}

export function getDb(): Database.Database {
  if (!globalThis.__readlogDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
    globalThis.__readlogDb = db;
  }
  return globalThis.__readlogDb;
}
