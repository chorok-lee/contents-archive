import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { DeleteNoteButton } from "@/components/DeleteNoteButton";
import { ReflectionEditor } from "@/components/ReflectionEditor";
import { formatDateLabel, toDateKey } from "@/lib/dates";
import { getNote } from "@/lib/notes";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  const n = Number(id);
  return isSupabaseConfigured() && Number.isInteger(n) && n > 0 ? getNote(n) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const note = await load((await params).id);
  return { title: note?.article.title ?? "기록" };
}

export default async function NotePage({ params }: Params) {
  const note = await load((await params).id);
  if (!note) notFound();

  return (
    <article className="flex flex-col gap-8">
      <div>
        <p className="mb-3 text-sm text-steel">{formatDateLabel(toDateKey(new Date(note.createdAt)))}</p>
        <ReflectionEditor key={note.updatedAt} id={note.id} initial={note.reflection} />
        {note.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {note.keywords.map((k) => (
              <Link key={k} href={`/archive?k=${encodeURIComponent(k)}`} className="tag-chip hover:underline">
                #{k}
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <ArticleCard article={note.article} />
        {note.article.summary.length > 0 && (
          <div className="rounded-lg bg-surface px-5 py-4">
            <h2 className="mb-2 text-[13px] font-semibold text-stone">3줄 요약</h2>
            <ul className="flex flex-col gap-1.5 text-[15px] leading-relaxed text-charcoal">
              {note.article.summary.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-stone">{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex gap-2 border-t border-hairline pt-6">
        <DeleteNoteButton id={note.id} />
        <Link href="/archive" className="btn btn-ghost ml-auto text-slate">
          ← 모아보기
        </Link>
      </div>
    </article>
  );
}
