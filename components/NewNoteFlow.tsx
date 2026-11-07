"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveNote } from "@/app/actions";
import { ClipboardToast, looksLikeUrl } from "./ClipboardToast";
import { LinkIcon, Plus } from "./icons";
import { LinkSheet, type Analyzed } from "./LinkSheet";
import { NoteEditor } from "./NoteEditor";

type Stage = "closed" | "sheet" | "editor";

/** ＋ button → link sheet (prefilled from the clipboard) → reflection editor with the bookmark attached. */
/**
 * `hero`: the home screen's big "링크 붙이기" card. `fab`: the floating ＋ button on the list.
 * Both open the same sheet; the clipboard toast comes with either.
 */
export function NewNoteFlow({ variant = "fab" }: { variant?: "hero" | "fab" }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("closed");
  const [prefill, setPrefill] = useState("");
  const [result, setResult] = useState<Analyzed | null>(null);
  const [startStep, setStartStep] = useState<1 | 2>(1);
  const [notice, setNotice] = useState<string | undefined>();
  const [savedLater, setSavedLater] = useState<"saved" | "existing" | null>(null);

  useEffect(() => {
    if (!savedLater) return;
    const t = setTimeout(() => setSavedLater(null), 4000);
    return () => clearTimeout(t);
  }, [savedLater]);

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

  async function saveLater(r: Analyzed) {
    const res = await saveNote(r.article.id, "", { later: true });
    if (!res.ok) return res;
    close();
    setSavedLater(res.existing ? "existing" : "saved");
    router.refresh();
    return { ok: true };
  }

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={open}
          className="card flex w-full items-center gap-4 p-5 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <LinkIcon size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[19px] font-bold">링크 붙이기</span>
            <span className="block text-[15px] text-steel">URL을 붙여넣으면 바로 요약해요</span>
          </span>
          <Plus size={22} className="text-stone" />
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label="새 기록"
          className="round-primary fixed right-[max(20px,calc(50%-21rem+20px))] bottom-[calc(max(16px,env(safe-area-inset-bottom))+80px)] z-20 size-14 shadow-float"
        >
          <Plus size={28} />
        </button>
      )}

      {savedLater && (
        <div
          role="status"
          className="animate-sheet-up fixed inset-x-0 bottom-[calc(max(16px,env(safe-area-inset-bottom))+80px)] z-20 mx-auto flex w-[calc(100%-32px)] max-w-md items-center justify-between gap-3 rounded-full bg-ink/90 px-5 py-3 text-[15px] text-white shadow-float backdrop-blur-xl"
        >
          <span>{savedLater === "existing" ? "이미 저장한 글이에요" : "나중에 읽기에 저장했어요"}</span>
          <Link href="/list?tab=later" className="font-semibold text-tint">
            보기
          </Link>
        </div>
      )}

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
          onSaveLater={saveLater}
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
