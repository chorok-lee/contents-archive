"use client";

import { useState, useTransition } from "react";
import { useVisualViewport, viewportStyle } from "@/lib/useVisualViewport";
import { BookmarkClip, type Bookmark } from "./BookmarkClip";
import { Check, ChevronLeft, Trash } from "./icons";

interface Props {
  bookmark: Bookmark;
  initialText?: string;
  onSave: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}

/** Full-screen writing layer: back · (delete) · ✓ on top, the reflection, and the bookmark clipped below. */
export function NoteEditor({ bookmark, initialText = "", onSave, onClose, onDelete }: Props) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = text.trim() !== initialText.trim();
  const viewport = useVisualViewport();
  const keyboardOpen = viewport?.keyboardOpen ?? false;

  function close() {
    if (dirty && !confirm("작성 중인 내용이 사라져요. 닫을까요?")) return;
    onClose();
  }

  function save() {
    startTransition(async () => {
      const res = await onSave(text);
      if (!res.ok) setError(res.error ?? "저장하지 못했어요.");
    });
  }

  function remove() {
    if (!onDelete || !confirm("이 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
    startTransition(onDelete);
  }

  return (
    <div className="animate-slide-in fixed inset-0 z-40 flex flex-col bg-canvas" style={viewportStyle(viewport)}>
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 py-2">
          <button type="button" onClick={close} aria-label="뒤로" className="glass-btn mr-auto">
            <ChevronLeft size={24} />
          </button>
          {onDelete && (
            <button type="button" onClick={remove} disabled={pending} aria-label="삭제" className="glass-btn text-error">
              <Trash size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || !text.trim() || (!!onDelete && !dirty)}
            aria-label="저장"
            className="round-primary"
          >
            <Check size={24} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 rounded-md bg-tint-peach px-4 py-3 text-[15px] text-charcoal">
            {error}
          </p>
        )}

        <label htmlFor="reflection" className="sr-only">
          느낀 점
        </label>
        <textarea
          id="reflection"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) save();
          }}
          autoFocus
          placeholder="무엇이 남았나요?"
          className="mt-4 min-h-0 w-full flex-1 resize-none bg-transparent px-1 text-[19px] leading-relaxed outline-none placeholder:text-stone"
        />

        <div className={`pt-3 ${keyboardOpen ? "pb-2" : "pb-[max(16px,env(safe-area-inset-bottom))]"}`}>
          <BookmarkClip bookmark={bookmark} compact={keyboardOpen} />
        </div>
      </div>
    </div>
  );
}
