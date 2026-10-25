"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayKey } from "@/lib/dates";
import {
  createEntry,
  deleteEntry,
  updateEntry,
  type EntryInput,
} from "@/lib/entries";
import { normalizeUrl } from "@/lib/metadata";
import { isMood } from "@/lib/moods";

export interface SaveState {
  error?: string;
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(form: FormData, key: string): string | null {
  return text(form, key) || null;
}

function parseEntry(form: FormData): EntryInput | string {
  const url = normalizeUrl(text(form, "url"));
  if (!url) return "올바른 URL을 입력해 주세요.";

  const title = text(form, "title");
  if (!title) return "글 제목을 입력해 주세요.";

  const status = text(form, "status") === "to_read" ? "to_read" : "read";
  const summary = text(form, "summary");
  if (status === "read" && !summary) return "한 줄 요약을 적어 주세요.";
  if (summary.length > 140) return "한 줄 요약은 140자 이내로 적어 주세요.";

  const readOn = text(form, "readOn");
  const mood = text(form, "mood");
  const minutes = Number.parseInt(text(form, "readingMinutes"), 10);

  return {
    url,
    title,
    description: optional(form, "description"),
    image: optional(form, "image"),
    siteName: optional(form, "siteName"),
    author: optional(form, "author"),
    publishedAt: optional(form, "publishedAt"),
    readingMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    summary,
    reflection: text(form, "reflection"),
    mood: isMood(mood) ? mood : null,
    status,
    readOn: /^\d{4}-\d{2}-\d{2}$/.test(readOn) ? readOn : todayKey(),
    quotes: form
      .getAll("quote")
      .map((q) => String(q).trim())
      .filter(Boolean),
    tags: [
      ...new Set(
        text(form, "tags")
          .split(",")
          .map((t) => t.trim().replace(/^#/, ""))
          .filter(Boolean),
      ),
    ],
  };
}

export async function saveEntry(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const input = parseEntry(form);
  if (typeof input === "string") return { error: input };

  const idValue = Number(text(form, "id"));
  let id: number;
  if (Number.isInteger(idValue) && idValue > 0) {
    updateEntry(idValue, input);
    id = idValue;
  } else {
    id = createEntry(input);
  }

  revalidatePath("/", "layout");
  redirect(`/entries/${id}`);
}

export async function removeEntry(id: number): Promise<void> {
  deleteEntry(id);
  revalidatePath("/", "layout");
  redirect("/archive");
}
