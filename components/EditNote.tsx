"use client";

import { useRouter } from "next/navigation";
import { removeNote, updateReflection } from "@/app/actions";
import type { Bookmark } from "./BookmarkClip";
import { NoteEditor } from "./NoteEditor";

interface Props {
  id: number;
  reflection: string;
  bookmark: Bookmark;
}

/** Edits a note; a "read later" item (no reflection yet) opens empty and moves to the read list once written. */
export function EditNote({ id, reflection, bookmark }: Props) {
  const router = useRouter();
  const isLater = reflection === "";
  const back = isLater ? "/list?tab=later" : "/list";
  return (
    <NoteEditor
      bookmark={bookmark}
      initialText={reflection}
      onClose={() => router.push(back)}
      onSave={async (text) => {
        const res = await updateReflection(id, text);
        if (res.ok) router.push("/list");
        return res;
      }}
      onDelete={() => removeNote(id, isLater ? "later" : "read")}
    />
  );
}
