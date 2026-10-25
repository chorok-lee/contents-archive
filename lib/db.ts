import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.READLOG_DB ?? path.join(process.cwd(), "data", "readlog.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS articles (
  id              INTEGER PRIMARY KEY,
  url             TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT,
  image           TEXT,
  site_name       TEXT,
  author          TEXT,
  published_at    TEXT,
  reading_minutes INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entries (
  id          INTEGER PRIMARY KEY,
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  summary     TEXT NOT NULL DEFAULT '',
  reflection  TEXT NOT NULL DEFAULT '',
  mood        TEXT,
  status      TEXT NOT NULL DEFAULT 'read' CHECK (status IN ('read', 'to_read')),
  read_on     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS entries_read_on ON entries(read_on);

CREATE TABLE IF NOT EXISTS quotes (
  id        INTEGER PRIMARY KEY,
  entry_id  INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  text      TEXT NOT NULL,
  position  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quotes_entry ON quotes(entry_id);

CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id  INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id    INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
`;

declare global {
  var __readlogDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!globalThis.__readlogDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
    globalThis.__readlogDb = db;
  }
  return globalThis.__readlogDb;
}
