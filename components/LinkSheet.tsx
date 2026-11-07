"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ClipboardEvent, type FormEvent } from "react";
import { analyzeUrl, type AnalyzeResult } from "@/app/actions";
import { useVisualViewport, viewportStyle } from "@/lib/useVisualViewport";
import { ChevronLeft, Close, LinkIcon } from "./icons";

export type Analyzed = Extract<AnalyzeResult, { ok: true }>;

interface Props {
  /** URL found on the clipboard when the sheet opened; analysis starts right away in the background. */
  prefill: string;
  /** Result kept from an earlier visit (coming back from the editor) — reopens on the summary step. */
  initial: Analyzed | null;
  /** Step to open on: 2 skips straight to the summary (used by the clipboard toast). */
  startStep?: 1 | 2;
  /** Hint shown on the link step, e.g. when the clipboard had no link. */
  notice?: string;
  onCancel: () => void;
  onAttach: (result: Analyzed) => void;
  /** Saves the link without a reflection to the "read later" list. */
  onSaveLater: (result: Analyzed) => Promise<{ ok: boolean; error?: string }>;
}

/** Two-step sheet: 1) paste the link, 2) check the 3-line summary, then attach it as a bookmark. */
export function LinkSheet({ prefill, initial, startStep = 1, notice, onCancel, onAttach, onSaveLater }: Props) {
  const [step, setStep] = useState<1 | 2>(initial ? 2 : startStep);
  const viewport = useVisualViewport();
  const compact = viewport?.keyboardOpen ?? false;
  const [url, setUrl] = useState(initial?.article.url ?? "");
  const [result, setResult] = useState<Analyzed | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [savingLater, startSavingLater] = useTransition();
  const [laterError, setLaterError] = useState<string | null>(null);
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
      if (res.ok) {
        setResult(res);
      } else {
        setError(res.error);
        setStep(1); // errors are fixed on the link step
      }
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

  function next(e: FormEvent) {
    e.preventDefault();
    if (!result && !analyzing) analyze(url);
    setStep(2);
  }

  function clear() {
    requestRef.current++;
    setUrl("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={viewportStyle(viewport)}>
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="animate-fade-in absolute inset-0 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-sheet-title"
        className={`animate-sheet-up relative flex max-h-[calc(100%-8px)] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl bg-canvas px-5 pt-2 ${compact ? "pb-3" : "pb-[max(20px,env(safe-area-inset-bottom))]"}`}
      >
        <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-hairline" />
        <div className="relative mt-2 flex h-10 items-center justify-center">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} aria-label="링크 다시 입력" className="glass-btn absolute left-0 size-10">
              <ChevronLeft size={20} />
            </button>
          )}
          <StepDots step={step} />
          <button type="button" onClick={onCancel} aria-label="닫기" className="glass-btn absolute right-0 size-10">
            <Close size={18} />
          </button>
        </div>

        {step === 1 ? (
          <form key="step-1" onSubmit={next} className="animate-slide-in flex flex-col">
            <h2
              id="link-sheet-title"
              className={`text-center leading-tight font-bold tracking-tight ${compact ? "mt-1 text-[22px]" : "mt-6 text-[32px]"}`}
            >
              링크 붙이기
            </h2>
            {!compact && <p className="mt-2 text-center text-[17px] text-steel">오늘 읽은 글의 URL을 붙여넣어 주세요</p>}
            {notice && <p className="mt-3 rounded-md bg-surface px-4 py-2.5 text-center text-[15px] text-slate">{notice}</p>}

            <div className={compact ? "h-4" : "my-8 flex justify-center"}>
              {!compact && (
              <span className="flex size-28 items-center justify-center rounded-2xl bg-tint text-primary">
                <LinkIcon size={44} />
              </span>
              )}
            </div>

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
                  if (result || error) {
                    requestRef.current++;
                    setResult(null);
                    setError(null);
                  }
                }}
                onPaste={onPaste}
                type="text"
                inputMode="url"
                enterKeyHint="next"
                autoComplete="off"
                autoFocus={!prefill}
                placeholder="https://"
                aria-invalid={!!error}
                aria-describedby={error ? "url-error" : undefined}
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
            {error && (
              <p id="url-error" role="alert" className="mt-2 px-1 text-[15px] text-error">
                {error}
              </p>
            )}

            <button type="submit" disabled={!url.trim()} className="btn btn-dark mt-4 w-full">
              다음
            </button>
          </form>
        ) : (
          <div key="step-2" className="animate-slide-in flex flex-col">
            <h2 id="link-sheet-title" className="mt-6 text-center text-[32px] leading-tight font-bold tracking-tight">
              3줄 요약
            </h2>
            <p className="mt-2 text-center text-[17px] text-steel">
              {analyzing ? "글을 읽고 있어요…" : "지금 느낀 점을 남기거나, 나중에 읽기로 저장해요"}
            </p>

            <div className="my-6">
              <Summary result={result} analyzing={analyzing} />
            </div>

            {result?.existingNoteId && (
              <p className="mb-3 text-center text-[15px] text-steel">
                이미 기록한 글이에요 ·{" "}
                <Link href={`/notes/${result.existingNoteId}`} className="font-medium text-link">
                  이전 기록 보기
                </Link>
              </p>
            )}

            {laterError && (
              <p role="alert" className="mb-2 text-center text-[15px] text-error">
                {laterError}
              </p>
            )}
            <button
              type="button"
              onClick={() => result && onAttach(result)}
              disabled={analyzing || !result || savingLater}
              className="btn btn-dark w-full"
            >
              {analyzing ? "요약하는 중…" : "느낀 점 쓰기"}
            </button>
            <button
              type="button"
              onClick={() =>
                result &&
                startSavingLater(async () => {
                  const res = await onSaveLater(result);
                  setLaterError(res.ok ? null : (res.error ?? "저장하지 못했어요."));
                })
              }
              disabled={analyzing || !result || savingLater}
              className="btn btn-secondary mt-2 min-h-14 w-full rounded-lg"
            >
              {savingLater ? "저장하는 중…" : "나중에 읽기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex gap-1.5" aria-label={`2단계 중 ${step}단계`}>
      {[1, 2].map((n) => (
        <span
          key={n}
          className={`h-2 rounded-full transition-all ${n === step ? "w-5 bg-ink" : "w-2 bg-hairline"}`}
        />
      ))}
    </div>
  );
}

function Summary({ result, analyzing }: { result: Analyzed | null; analyzing: boolean }) {
  if (analyzing || !result) {
    return (
      <div aria-busy="true" aria-label="글을 읽고 요약하는 중" className="rounded-xl bg-surface p-4">
        <div className="h-32 animate-pulse rounded-lg bg-fill" />
        {[70, 92, 80].map((w) => (
          <div key={w} className="mt-3 h-3.5 animate-pulse rounded-full bg-fill" style={{ width: `${w}%` }} />
        ))}
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
            {result.failure === "login"
              ? "이 사이트는 로그인 화면으로 넘어가서 본문을 읽지 못했어요. 그래도 느낀 점은 남길 수 있어요."
              : result.failure
                ? "글을 불러오지 못해 요약이 없어요. 그래도 느낀 점은 남길 수 있어요."
                : "요약할 본문을 찾지 못했어요. 그래도 느낀 점은 남길 수 있어요."}
          </p>
        )}
      </div>
    </div>
  );
}
