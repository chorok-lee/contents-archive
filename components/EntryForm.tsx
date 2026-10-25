"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { saveEntry, type SaveState } from "@/app/actions";
import type { EntryInput } from "@/lib/entries";
import { MOODS } from "@/lib/moods";
import { ArticleCard } from "./ArticleCard";

interface Props {
  id?: number;
  initial: EntryInput;
  metaError?: string;
  tagSuggestions: string[];
}

export function EntryForm({ id, initial, metaError, tagSuggestions }: Props) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveEntry, {});

  const [article, setArticle] = useState({
    url: initial.url,
    title: initial.title,
    description: initial.description ?? "",
    image: initial.image ?? "",
    siteName: initial.siteName ?? "",
    author: initial.author ?? "",
    publishedAt: initial.publishedAt ?? "",
    readingMinutes: initial.readingMinutes ? String(initial.readingMinutes) : "",
  });
  const [status, setStatus] = useState(initial.status);
  const [summary, setSummary] = useState(initial.summary);
  const [reflection, setReflection] = useState(initial.reflection);
  const [preview, setPreview] = useState(false);
  const [quotes, setQuotes] = useState(initial.quotes.length ? initial.quotes : [""]);
  const [tags, setTags] = useState(initial.tags);
  const [tagDraft, setTagDraft] = useState("");

  const needsArticleInfo = !initial.url || !initial.title;
  const setField = (key: keyof typeof article) => (value: string) =>
    setArticle((a) => ({ ...a, [key]: value }));

  function addTag(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (parts.length) setTags((t) => [...new Set([...t, ...parts])]);
    setTagDraft("");
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((t) => t.slice(0, -1));
    }
  }

  const previewArticle = {
    ...article,
    description: article.description || null,
    image: article.image || null,
    siteName: article.siteName || null,
    author: article.author || null,
    publishedAt: article.publishedAt || null,
    readingMinutes: Number(article.readingMinutes) || null,
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {id && <input type="hidden" name="id" value={id} />}
      {Object.entries(article).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input type="hidden" name="status" value={status} />

      <section className="flex flex-col gap-3">
        {metaError && (
          <p className="rounded-md bg-tint-peach px-4 py-3 text-sm text-charcoal">⚠️ {metaError}</p>
        )}
        {article.url && article.title && <ArticleCard article={previewArticle} />}
        <details open={needsArticleInfo} className="group rounded-lg border border-hairline">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate select-none">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
            글 정보 {needsArticleInfo ? "입력" : "수정"}
          </summary>
          <div className="grid gap-4 border-t border-hairline p-4 sm:grid-cols-2">
            <Field label="URL" className="sm:col-span-2">
              <input className="input" value={article.url} onChange={(e) => setField("url")(e.target.value)} required inputMode="url" placeholder="https://" />
            </Field>
            <Field label="제목" className="sm:col-span-2">
              <input className="input" value={article.title} onChange={(e) => setField("title")(e.target.value)} required />
            </Field>
            <Field label="설명" className="sm:col-span-2">
              <input className="input" value={article.description} onChange={(e) => setField("description")(e.target.value)} />
            </Field>
            <Field label="사이트">
              <input className="input" value={article.siteName} onChange={(e) => setField("siteName")(e.target.value)} />
            </Field>
            <Field label="작성자">
              <input className="input" value={article.author} onChange={(e) => setField("author")(e.target.value)} />
            </Field>
            <Field label="읽는 시간 (분)">
              <input className="input" type="number" min={1} value={article.readingMinutes} onChange={(e) => setField("readingMinutes")(e.target.value)} />
            </Field>
            <Field label="썸네일 이미지 URL">
              <input className="input" value={article.image} onChange={(e) => setField("image")(e.target.value)} />
            </Field>
          </div>
        </details>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label">상태</span>
          <div className="flex gap-2" role="radiogroup" aria-label="상태">
            {(
              [
                ["read", "읽음"],
                ["to_read", "읽을 예정"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={status === value}
                aria-current={status === value}
                onClick={() => setStatus(value)}
                className="pill-tab"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Field label="읽은 날">
          <input className="input" type="date" name="readOn" defaultValue={initial.readOn} required />
        </Field>
      </section>

      <Field label={status === "read" ? "한 줄 요약" : "한 줄 메모 (선택)"}>
        <input
          className="input"
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={140}
          required={status === "read"}
          placeholder="이 글을 한 문장으로 말하면?"
        />
        <p className="mt-1 text-right text-[12px] text-stone">{summary.length}/140</p>
      </Field>

      <fieldset>
        <legend className="label">어땠나요?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOODS.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-3 py-2.5 text-sm has-checked:border-primary has-checked:ring-1 has-checked:ring-primary ${m.tint}`}
            >
              <input type="radio" name="mood" value={m.value} defaultChecked={initial.mood === m.value} className="sr-only" />
              <span className="text-lg" aria-hidden>
                {m.emoji}
              </span>
              <span className="font-medium text-charcoal">{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <span className="label mb-0">느낀 점</span>
          <div role="tablist" className="flex gap-4">
            <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className="segmented-tab">
              작성
            </button>
            <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)} className="segmented-tab">
              미리보기
            </button>
          </div>
        </div>
        <textarea
          name="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={10}
          placeholder={"무엇이 인상 깊었나요? 내 일/생활에 어떻게 연결되나요?\n\n마크다운을 쓸 수 있어요. **굵게**, - 목록, > 인용"}
          className={`input min-h-56 resize-y leading-relaxed ${preview ? "hidden" : ""}`}
        />
        {preview && (
          <div className="prose-note min-h-56 rounded-md border border-hairline px-4 py-3">
            {reflection.trim() ? <ReactMarkdown>{reflection}</ReactMarkdown> : <p className="text-muted">아직 작성한 내용이 없어요.</p>}
          </div>
        )}
      </div>

      <div>
        <span className="label">인상 깊은 문장</span>
        <div className="flex flex-col gap-2">
          {quotes.map((quote, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                name="quote"
                value={quote}
                rows={2}
                onChange={(e) => setQuotes((q) => q.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder="글에서 기억하고 싶은 문장"
                className="input resize-y border-l-[3px] border-l-ink"
              />
              <button
                type="button"
                onClick={() => setQuotes((q) => (q.length > 1 ? q.filter((_, j) => j !== i) : [""]))}
                className="btn btn-ghost shrink-0 self-start text-steel"
                aria-label="문장 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setQuotes((q) => [...q, ""])} className="btn btn-ghost mt-2 text-slate">
          + 문장 추가
        </button>
      </div>

      <div>
        <label htmlFor="tag-input" className="label">
          태그
        </label>
        <div className="input flex min-h-11 flex-wrap items-center gap-1.5 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip">
              #{tag}
              <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))} aria-label={`${tag} 태그 삭제`} className="text-purple-800/60 hover:text-purple-800">
                ✕
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            list="tag-suggestions"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={() => tagDraft && addTag(tagDraft)}
            placeholder={tags.length ? "" : "엔터나 쉼표로 추가"}
            className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted"
          />
          <datalist id="tag-suggestions">
            {tagSuggestions.filter((t) => !tags.includes(t)).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-hairline bg-canvas/95 px-4 py-3 backdrop-blur">
        {state.error && (
          <p role="alert" className="mr-auto text-sm text-error">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary min-w-24">
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
