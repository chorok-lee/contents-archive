import Link from "next/link";
import { NewNoteFlow } from "@/components/NewNoteFlow";
import { NoteCard } from "@/components/NoteCard";
import { SetupNotice } from "@/components/SetupNotice";
import { countLater, isStorageConfigured, listNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

const today = new Intl.DateTimeFormat("ko-KR", {
  timeZone: process.env.READLOG_TZ ?? "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "long",
});

export default async function HomePage() {
  const header = (
    <header className="mt-6 mb-6">
      <p className="text-[15px] font-semibold text-steel">{today.format(new Date())}</p>
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Readlog</h1>
    </header>
  );

  if (!isStorageConfigured()) {
    return (
      <>
        {header}
        <SetupNotice />
      </>
    );
  }

  const [recent, laterCount] = await Promise.all([listNotes({ status: "read", limit: 3 }), countLater()]);

  return (
    <>
      {header}
      <NewNoteFlow variant="hero" />

      {laterCount > 0 && (
        <Link
          href="/list?tab=later"
          className="card mt-3 flex items-center gap-3 px-5 py-4 transition-transform active:scale-[0.98]"
        >
          <span className="text-xl" aria-hidden>
            🔖
          </span>
          <span className="flex-1 text-[17px] font-semibold">나중에 읽기</span>
          <span className="text-[17px] text-steel">{laterCount}개</span>
          <span className="text-stone" aria-hidden>
            ›
          </span>
        </Link>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-[22px] font-bold tracking-tight">최근 기록</h2>
          {recent.length > 0 && (
            <Link href="/list" className="text-[15px] font-medium text-primary">
              모두 보기
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <p className="text-3xl">📖</p>
            <p className="mt-3 text-[17px] font-semibold">아직 기록이 없어요</p>
            <p className="mt-1 text-[15px] text-steel">링크를 붙여넣고 느낀 점을 남겨 보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recent.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
