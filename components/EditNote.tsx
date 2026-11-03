"use client";

import { useRouter } from "next/navigation";
import { removeNote, updateReflection } from "@/app/actions";
import type { Bookmark } from "./BookmarkClip";
import { NoteEditor } from "./NoteEditor";

export function EditNote({ id, reflection, bookmark }: { id: number; reflection: string; bookmark: Bookmark }) {
  const router = useRouter();
  return (
    <NoteEditor
      bookmark={bookmark}
      initialText={reflection}
      onClose={() => router.push("/")}
      onSave={async (text) => {
        const res = await updateReflection(id, text);
        if (res.ok) router.push("/");
        return res;
      }}
      onDelete={() => removeNote(id)}
    />
  );
}
