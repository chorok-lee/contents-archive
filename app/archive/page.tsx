import type { Metadata } from "next";
import Link from "next/link";
import { NoteCard } from "@/components/NoteCard";
import { formatDateLabel, toDateKey } from "@/lib/dates";
import { isKeyword } from "@/lib/keywords";
import { keywordCounts, listNotes, type Note } from "@/lib/notes";

export const metadata: Metadata = { title: "모아보기" };
export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;
  const active = isKeyword(k) ? k : undefined;
  const notes = listNotes(active);
  const chips = keywordCounts();
  const total = chips.length ? listNotes().length : notes.length;

  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    const day = toDateKey(new Date(note.createdAt));
    groups.set(day, [...(groups.get(day) ?? []), note]);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold tracking-[-0.5px]">모아보기</h1>

      {chips.length > 0 && (
        <nav
          aria-label="키워드"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        >
          <Link href="/archive" aria-current={!active} className="pill-tab">
            전체 <span className="ml-1 opacity-60">{total}</span>
          </Link>
          {chips.map(({ keyword, count }) => (
            <Link
              key={keyword}
              href={`/archive?k=${encodeURIComponent(keyword)}`}
              aria-current={active === keyword}
              className="pill-tab"
            >
              {keyword} <span className="ml-1 opacity-60">{count}</span>
            </Link>
          ))}
        </nav>
      )}

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center">
          <p className="text-3xl">📝</p>
          <p className="mt-3 font-medium">{active ? `#${active} 기록이 없어요` : "아직 기록이 없어요"}</p>
          <Link href="/" className="btn btn-primary mt-5">
            첫 기록 남기기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups].map(([day, dayNotes]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold text-slate">{formatDateLabel(day)}</h2>
              <div className="flex flex-col gap-3">
                {dayNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
