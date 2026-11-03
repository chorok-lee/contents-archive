"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ClipboardEvent, type FormEvent } from "react";
import { analyzeUrl, type AnalyzeResult } from "@/app/actions";
import { Close, LinkIcon } from "./icons";

export type Analyzed = Extract<AnalyzeResult, { ok: true }>;

interface Props {
  /** URL found on the clipboard when the sheet opened; analyzed right away. */
  prefill: string;
  /** Result kept from an earlier visit (coming back from the editor). */
  initial: Analyzed | null;
  onCancel: () => void;
  onAttach: (result: Analyzed) => void;
}

export function LinkSheet({ prefill, initial, onCancel, onAttach }: Props) {
  const [url, setUrl] = useState(initial?.article.url ?? "");
  const [result, setResult] = useState<Analyzed | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const requestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function analyze(value: string) {
    const target = value.trim();
    if (!target) return;
    const request = ++requestRef.current;
    setError(null);
    setResult(null);
    startAnalyze(async () => {
      const res = await analyzeUrl(target);
      if (request !== requestRef.current) return; // a newer URL replaced this one
      if (res.ok) setResult(res);
      else setError(res.error);
    });
  }

  useEffect(() => {
    if (!prefill || initial) return; // coming back from the editor keeps the earlier result
    setUrl(prefill);
    analyze(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per clipboard value
  }, [prefill]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;
    e.preventDefault();
    setUrl(pasted);
    analyze(pasted);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (result) onAttach(result);
    else analyze(url);
  }

  function clear() {
    requestRef.current++;
    setUrl("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="animate-fade-in absolute inset-0 bg-black/30"
      />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-sheet-title"
        className="animate-sheet-up relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl bg-canvas px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        <span aria-hidden className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-hairline" />
        <button type="button" onClick={onCancel} aria-label="닫기" className="glass-btn absolute top-3 right-4 size-10">
          <Close size={18} />
        </button>

        <h2 id="link-sheet-title" className="mt-8 text-center text-[32px] leading-tight font-bold tracking-tight">
          링크 붙이기
        </h2>
        <p className="mt-2 text-center text-[17px] text-steel">
          읽은 글의 URL을 붙여넣으면
          <br />
          3줄로 요약해 드려요
        </p>

        <div className="my-6">
          <Preview result={result} analyzing={analyzing} error={error} />
        </div>

        {result?.existingNoteId && (
          <p className="mb-3 text-center text-[15px] text-steel">
            이미 기록한 글이에요 ·{" "}
            <Link href={`/notes/${result.existingNoteId}`} className="font-medium text-link">
              이전 기록 보기
            </Link>
          </p>
        )}

        <div className="relative">
          <label htmlFor="url-input" className="sr-only">
            아티클 URL
          </label>
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-steel">
            <LinkIcon size={20} />
          </span>
          <input
            id="url-input"
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (result) setResult(null);
            }}
            onPaste={onPaste}
            type="text"
            inputMode="url"
            enterKeyHint="go"
            autoComplete="off"
            autoFocus={!prefill && !initial}
            placeholder="https://"
            className="input px-12"
          />
          {url && (
            <button
              type="button"
              onClick={clear}
              aria-label="입력 지우기"
              className="absolute top-1/2 right-4 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-stone text-canvas"
            >
              <Close size={13} strokeWidth={3} />
            </button>
          )}
        </div>

        <button type="submit" disabled={analyzing || !url.trim()} className="btn btn-dark mt-3 w-full">
          {analyzing ? "글을 읽는 중…" : result ? "북마크 붙이기" : "불러오기"}
        </button>
      </form>
    </div>
  );
}

function Preview({ result, analyzing, error }: { result: Analyzed | null; analyzing: boolean; error: string | null }) {
  if (analyzing) {
    return (
      <div aria-busy="true" aria-label="글을 읽고 요약하는 중" className="rounded-xl bg-surface p-4">
        <div className="h-32 animate-pulse rounded-lg bg-fill" />
        {[70, 92, 80].map((w) => (
          <div key={w} className="mt-3 h-3.5 animate-pulse rounded-full bg-fill" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-tint-peach px-5 py-6 text-center text-[15px] text-charcoal">
        {error}
      </p>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-hairline px-5 py-10 text-steel">
        <LinkIcon size={28} />
        <p className="text-[15px]">미리보기가 여기에 나와요</p>
      </div>
    );
  }

  const { article, summary } = result;
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl bg-surface">
      {article.image && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
        <img src={article.image} alt="" referrerPolicy="no-referrer" className="h-36 w-full object-cover" />
      )}
      <div className="p-4">
        <p className="truncate text-[13px] font-medium text-primary">
          {article.siteName ?? new URL(article.url).hostname}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[17px] leading-snug font-semibold">{article.title}</p>
        {summary.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-1 text-[15px] leading-relaxed text-slate">
            {summary.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-stone">{i + 1}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-[15px] text-steel">
            {result.fetchFailed ? "글을 불러오지 못했어요. 그래도 느낀 점은 남길 수 있어요." : "요약할 본문을 찾지 못했어요."}
          </p>
        )}
      </div>
    </div>
  );
}
