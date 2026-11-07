import type { Metadata } from "next";
import Link from "next/link";
import { LaterCard } from "@/components/LaterCard";
import { NewNoteFlow } from "@/components/NewNoteFlow";
import { NoteCard } from "@/components/NoteCard";
import { SetupNotice } from "@/components/SetupNotice";
import { isKeyword } from "@/lib/keywords";
import { countLater, isStorageConfigured, keywordCounts, listNotes } from "@/lib/notes";

export const metadata: Metadata = { title: "목록" };
export const dynamic = "force-dynamic";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; k?: string }>;
}) {
  const title = <h1 className="mt-6 mb-4 text-[34px] leading-tight font-bold tracking-tight">목록</h1>;
  if (!isStorageConfigured()) {
    return (
      <>
        {title}
        <SetupNotice />
      </>
    );
  }

  const { tab, k } = await searchParams;
  const later = tab === "later";
  const keyword = !later && isKeyword(k) ? k : undefined;
  const [notes, laterCount, chips] = await Promise.all([
    listNotes({ status: later ? "later" : "read", keyword }),
    countLater(),
    later ? Promise.resolve([]) : keywordCounts(),
  ]);

  return (
    <>
      {title}

      <div role="tablist" aria-label="목록 보기" className="mb-4 grid grid-cols-2 rounded-md bg-fill p-1">
        <Link role="tab" href="/list" aria-selected={!later} className="segment">
          읽은 글
        </Link>
        <Link role="tab" href="/list?tab=later" aria-selected={later} className="segment">
          나중에 읽기{laterCount > 0 && <span className="ml-1 opacity-60">{laterCount}</span>}
        </Link>
      </div>

      {!later && chips.length > 0 && (
        <nav aria-label="키워드" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Link href="/list" aria-current={!keyword} className="pill-tab">
            전체
          </Link>
          {chips.map((c) => (
            <Link
              key={c.keyword}
              href={`/list?k=${encodeURIComponent(c.keyword)}`}
              aria-current={keyword === c.keyword}
              className="pill-tab"
            >
              {c.keyword}
              <span className="opacity-50">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {notes.length === 0 ? (
        <div className="card mt-2 px-6 py-12 text-center">
          <p className="text-3xl">{later ? "🔖" : "📖"}</p>
          <p className="mt-3 text-[17px] font-semibold">
            {later ? "나중에 읽을 글이 없어요" : keyword ? `${keyword} 기록이 없어요` : "아직 읽은 글이 없어요"}
          </p>
          <p className="mt-1 text-[15px] text-steel">
            {later ? "링크를 붙이고 ‘나중에 읽기’를 누르면 여기에 모여요" : "＋를 눌러 오늘 읽은 글을 남겨 보세요"}
          </p>
        </div>
      ) : (
        <div className={`flex flex-col ${later ? "gap-3" : "gap-4"}`}>
          {notes.map((note) =>
            later ? <LaterCard key={note.id} note={note} /> : <NoteCard key={note.id} note={note} />,
          )}
        </div>
      )}

      <NewNoteFlow />
    </>
  );
}
