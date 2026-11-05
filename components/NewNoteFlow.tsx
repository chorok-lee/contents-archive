"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveNote } from "@/app/actions";
import { ClipboardToast, looksLikeUrl } from "./ClipboardToast";
import { Plus } from "./icons";
import { LinkSheet, type Analyzed } from "./LinkSheet";
import { NoteEditor } from "./NoteEditor";

type Stage = "closed" | "sheet" | "editor";

/** ＋ button → link sheet (prefilled from the clipboard) → reflection editor with the bookmark attached. */
export function NewNoteFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("closed");
  const [prefill, setPrefill] = useState("");
  const [result, setResult] = useState<Analyzed | null>(null);
  const [startStep, setStartStep] = useState<1 | 2>(1);
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    document.body.style.overflow = stage === "closed" ? "" : "hidden";
  }, [stage]);

  /** From the clipboard toast: a link skips straight to the summary step. */
  function openFromToast(url: string | null) {
    setResult(null);
    setPrefill(url ?? "");
    setStartStep(url ? 2 : 1);
    setNotice(url ? undefined : "클립보드에 링크가 없어요. 직접 붙여넣어 주세요.");
    setStage("sheet");
  }

  function open() {
    setPrefill("");
    setResult(null);
    setStartStep(1);
    setNotice(undefined);
    setStage("sheet");
    // Must run inside the tap: browsers only allow clipboard reads on a user gesture
    // (iOS Safari shows its own "Paste" confirmation).
    navigator.clipboard
      ?.readText?.()
      .then((text) => {
        const value = text.trim();
        if (looksLikeUrl(value)) setPrefill(value);
      })
      .catch(() => {}); // permission denied or empty: the user pastes by hand
  }

  function close() {
    setStage("closed");
    setResult(null);
  }

  async function save(text: string) {
    if (!result) return { ok: false, error: "글 정보가 없어요." };
    const res = await saveNote(result.article.id, text);
    if (!res.ok) return res;
    close();
    router.refresh();
    return { ok: true };
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="새 기록"
        className="round-primary fixed right-[max(20px,calc(50%-21rem+20px))] bottom-[max(24px,env(safe-area-inset-bottom))] z-20 size-16 shadow-float"
      >
        <Plus size={30} />
      </button>

      <ClipboardToast suppressed={stage !== "closed"} onAccept={openFromToast} />

      {stage === "sheet" && (
        <LinkSheet
          prefill={prefill}
          initial={result}
          startStep={startStep}
          notice={notice}
          onCancel={close}
          onAttach={(r) => {
            setResult(r);
            setStage("editor");
          }}
        />
      )}

      {stage === "editor" && result && (
        <NoteEditor
          bookmark={{ ...result.article, summary: result.summary }}
          onSave={save}
          onClose={() => setStage("sheet")}
        />
      )}
    </>
  );
}
