"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateReflection } from "@/app/actions";

export function ReflectionEditor({ id, initial }: { id: number; initial: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div>
        <p className="text-[18px] leading-[1.75] whitespace-pre-line text-ink">{initial}</p>
        <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost -ml-3 mt-2 text-slate">
          ✎ 느낀 점 수정
        </button>
      </div>
    );
  }

  function save() {
    startTransition(async () => {
      const res = await updateReflection(id, text);
      if (!res.ok) {
        setError(res.error ?? "저장하지 못했어요.");
        return;
      }
      setError(null);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="reflection-edit" className="sr-only">
        느낀 점
      </label>
      <textarea
        id="reflection-edit"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        autoFocus
        className="input min-h-40 resize-y leading-relaxed"
      />
      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-sm text-error">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setText(initial);
            setEditing(false);
          }}
          className="btn btn-secondary"
        >
          취소
        </button>
        <button type="button" onClick={save} disabled={pending || !text.trim()} className="btn btn-primary">
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
