import Link from "next/link";
import { NewNoteFlow } from "@/components/NewNoteFlow";
import { NoteCard } from "@/components/NoteCard";
import { SetupNotice } from "@/components/SetupNotice";
import { isKeyword } from "@/lib/keywords";
import { isStorageConfigured, keywordCounts, listNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  if (!isStorageConfigured()) {
    return (
      <>
        <h1 className="mt-6 mb-6 text-[34px] font-bold tracking-tight">Readlog</h1>
        <SetupNotice />
      </>
    );
  }

  const { k } = await searchParams;
  const active = isKeyword(k) ? k : undefined;
  const [notes, chips] = await Promise.all([listNotes(active), keywordCounts()]);

  return (
    <>
      <header className="mt-6 mb-4">
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Readlog</h1>
      </header>

      {chips.length > 0 && (
        <nav aria-label="키워드" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Link href="/" aria-current={!active} className="pill-tab">
            전체
          </Link>
          {chips.map(({ keyword, count }) => (
            <Link
              key={keyword}
              href={`/?k=${encodeURIComponent(keyword)}`}
              aria-current={active === keyword}
              className="pill-tab"
            >
              {keyword}
              <span className="opacity-50">{count}</span>
            </Link>
          ))}
        </nav>
      )}

      {notes.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <p className="text-4xl">📖</p>
          <p className="mt-4 text-[17px] font-semibold">
            {active ? `${active} 기록이 없어요` : "아직 기록이 없어요"}
          </p>
          <p className="mt-1 text-[15px] text-steel">＋를 눌러 오늘 읽은 글을 남겨 보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      <NewNoteFlow />
    </>
  );
}
