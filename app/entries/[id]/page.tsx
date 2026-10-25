import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArticleCard } from "@/components/ArticleCard";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { formatDateLabel } from "@/lib/dates";
import { getEntry } from "@/lib/entries";
import { findMood } from "@/lib/moods";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function load(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? getEntry(n) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = load((await params).id);
  return { title: entry?.title ?? "기록" };
}

export default async function EntryPage({ params }: Params) {
  const entry = load((await params).id);
  if (!entry) notFound();
  const mood = findMood(entry.mood);

  return (
    <article className="flex flex-col gap-8">
      <div>
        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm text-steel">
          <span>{formatDateLabel(entry.readOn)}</span>
          {entry.status === "to_read" && (
            <span className="rounded-sm bg-tint-yellow px-1.5 py-0.5 text-[12px] font-semibold text-charcoal">
              읽을 예정
            </span>
          )}
          {mood && (
            <span className={`rounded-sm px-1.5 py-0.5 text-[13px] font-medium text-charcoal ${mood.tint}`}>
              {mood.emoji} {mood.label}
            </span>
          )}
        </p>
        {entry.summary ? (
          <h1 className="text-[24px] leading-snug font-semibold tracking-[-0.3px] sm:text-[28px]">
            {entry.summary}
          </h1>
        ) : (
          <h1 className="text-[24px] leading-snug font-semibold text-steel sm:text-[28px]">
            아직 요약이 없어요
          </h1>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Link key={tag} href={`/archive?tag=${encodeURIComponent(tag)}`} className="tag-chip hover:underline">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ArticleCard article={entry} />

      {entry.reflection && (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold tracking-[1px] text-stone uppercase">느낀 점</h2>
          <div className="prose-note">
            <ReactMarkdown>{entry.reflection}</ReactMarkdown>
          </div>
        </section>
      )}

      {entry.quotes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold tracking-[1px] text-stone uppercase">인상 깊은 문장</h2>
          <div className="flex flex-col gap-3">
            {entry.quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="rounded-r-md border-l-[3px] border-ink bg-tint-cream px-4 py-3 whitespace-pre-line text-charcoal"
              >
                {quote}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2 border-t border-hairline pt-6">
        <Link href={`/entries/${entry.id}/edit`} className="btn btn-secondary">
          수정
        </Link>
        <DeleteEntryButton id={entry.id} />
        <Link href="/archive" className="btn btn-ghost ml-auto text-slate">
          ← 아카이브
        </Link>
      </div>
    </article>
  );
}
