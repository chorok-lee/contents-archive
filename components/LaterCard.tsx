import Link from "next/link";
import { formatNoteDate } from "@/lib/dates";
import type { Note } from "@/lib/notes";

/** A link saved to read later: the bookmark and its summary's first line, with a prompt to write. */
export function LaterCard({ note }: { note: Note }) {
  const { article } = note;
  return (
    <Link href={`/notes/${note.id}`} className="card flex items-center gap-3 p-3 transition-transform active:scale-[0.98]">
      {article.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
        <img src={article.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-tint text-2xl">🔖</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-steel">
          {article.siteName ?? new URL(article.url).hostname} · {formatNoteDate(note.createdAt)}
        </p>
        <p className="line-clamp-2 text-[16px] leading-snug font-semibold">{article.title}</p>
        {article.summary[0] && <p className="mt-0.5 truncate text-[14px] text-slate">{article.summary[0]}</p>}
      </div>
      <span className="shrink-0 self-end rounded-full bg-tint px-2.5 py-1 text-[12px] font-semibold text-primary">
        느낀 점 쓰기
      </span>
    </Link>
  );
}
