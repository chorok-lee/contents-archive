"use client";

import { useTransition } from "react";
import { removeEntry } from "@/app/actions";

export function DeleteEntryButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("이 기록을 삭제할까요? 되돌릴 수 없어요.")) {
          startTransition(() => removeEntry(id));
        }
      }}
      className="btn btn-ghost text-error"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
