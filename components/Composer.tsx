"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ClipboardEvent, type FormEvent } from "react";
import { analyzeUrl, saveNote, type AnalyzeResult } from "@/app/actions";
import { ArticleCard } from "./ArticleCard";

type Analyzed = Extract<AnalyzeResult, { ok: true }>;

export function Composer() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Analyzed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();
  const reflectionRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef(0);

  function analyze(value: string) {
    const target = value.trim();
    if (!target) return;
    const request = ++requestRef.current;
    setError(null);
    setResult(null);
    setSavedId(null);
    startAnalyze(async () => {
      const res = await analyzeUrl(target);
      if (request !== requestRef.current) return; // a newer URL was pasted meanwhile
      if (res.ok) {
        setResult(res);
        requestAnimationFrame(() => reflectionRef.current?.focus());
      } else {
        setError(res.error);
      }
    });
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;
    e.preventDefault();
    setUrl(pasted);
    analyze(pasted);
  }

  function onSubmitUrl(e: FormEvent) {
    e.preventDefault();
    analyze(url);
  }

  function save() {
    if (!result) return;
    startSave(async () => {
      const res = await saveNote(result.article.id, reflection);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedId(res.id);
      setResult(null);
      setReflection("");
      setUrl("");
    });
  }

  function reset() {
    requestRef.current++;
    setUrl("");
    setResult(null);
    setError(null);
    setReflection("");
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmitUrl} className="flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="url-input" className="sr-only">
            아티클 URL
          </label>
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-steel">
            <LinkIcon />
          </span>
          <input
            id="url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={onPaste}
            type="text"
            inputMode="url"
            enterKeyHint="go"
            autoComplete="off"
            autoFocus
            placeholder="https://"
            className="input input-search min-h-14 px-12 text-[17px]"
          />
          {url && (
            <button
              type="button"
              onClick={reset}
              aria-label="입력 지우기"
              className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-stone/40 text-[13px] text-canvas hover:bg-stone/60"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" disabled={analyzing || !url.trim()} className="btn btn-primary min-h-13 w-full text-[16px]">
          {analyzing ? "글을 읽는 중…" : "＋ 요약하기"}
        </button>
      </form>

      {savedId && (
        <p role="status" className="rounded-md bg-tint-mint px-4 py-3 text-sm text-charcoal">
          ✓ 저장했어요.{" "}
          <Link href="/archive" className="font-medium text-link underline">
            모아보기
          </Link>
          에서 볼 수 있어요.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-tint-peach px-4 py-3 text-sm text-charcoal">
          ⚠️ {error}
        </p>
      )}

      {analyzing && <AnalyzingSkeleton />}

      {result && (
        <>
          {result.existingNoteId && (
            <p className="rounded-md bg-tint-sky px-4 py-3 text-sm text-charcoal">
              이미 기록한 글이에요.{" "}
              <Link href={`/notes/${result.existingNoteId}`} className="font-medium text-link underline">
                이전 기록 보기
              </Link>
            </p>
          )}

          <section className="flex flex-col gap-3">
            <ArticleCard article={result.article} />
            <div className="rounded-lg bg-surface px-5 py-4">
              <h2 className="mb-2 text-[13px] font-semibold text-stone">3줄 요약</h2>
              {result.summary.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-[15px] leading-relaxed text-charcoal">
                  {result.summary.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-stone">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-steel">
                  {result.fetchFailed
                    ? "글을 불러오지 못해 요약을 만들지 못했어요. 느낀 점은 그대로 저장할 수 있어요."
                    : "요약할 본문을 찾지 못했어요."}
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <label htmlFor="reflection" className="text-[18px] font-semibold">
              느낀 점
            </label>
            <textarea
              id="reflection"
              ref={reflectionRef}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
              rows={6}
              placeholder="무엇이 남았나요? 한 줄이어도 괜찮아요."
              className="input min-h-40 resize-y leading-relaxed"
            />
            <div className="flex items-center justify-end gap-3">
              <span className="hidden text-[13px] text-stone sm:inline">⌘ + Enter</span>
              <button
                type="button"
                onClick={save}
                disabled={saving || !reflection.trim()}
                className="btn btn-primary min-w-28"
              >
                {saving ? "저장 중…" : "저장하기"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function AnalyzingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="글을 읽고 요약하는 중">
      <div className="card h-24 animate-pulse bg-surface-soft" />
      <div className="rounded-lg bg-surface px-5 py-4">
        <p className="mb-3 text-[13px] font-semibold text-stone">글을 읽고 요약하는 중…</p>
        {[92, 80, 64].map((w) => (
          <div key={w} className="mb-2 h-4 animate-pulse rounded-xs bg-hairline" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
