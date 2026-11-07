import * as memory from "./notes.memory";
import * as supabase from "./notes.supabase";
import { isSupabaseConfigured } from "./supabase";

export type { Article, Note, NoteFilter, NoteStatus } from "./notes.supabase";

const useMemory = process.env.NODE_ENV !== "production" && process.env.READLOG_FAKE_DB === "1";
const store: typeof supabase = useMemory ? memory : supabase;

export function isStorageConfigured(): boolean {
  return useMemory || isSupabaseConfigured();
}

export const {
  getArticleByUrl,
  getArticle,
  saveArticle,
  createNote,
  updateNote,
  deleteNote,
  getNote,
  listNotes,
  keywordCounts,
  countLater,
  findNoteIdByUrl,
} = store;
