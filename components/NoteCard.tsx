import Link from "next/link";
import { formatNoteDate } from "@/lib/dates";
import type { Note } from "@/lib/notes";

export function NoteCard({ note }: { note: Note }) {
  const { article } = note;
  return (
    <Link
      href={`/notes/${note.id}`}
      className="card block p-2 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 rounded-lg bg-tint p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-primary">
            {article.siteName ?? new URL(article.url).hostname}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug font-semibold text-charcoal">
            {article.title}
          </p>
        </div>
        {article.image && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
          <img
            src={article.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-14 shrink-0 rounded-sm object-cover"
          />
        )}
      </div>

      <p className="line-clamp-4 px-3 pt-4 pb-3 text-[17px] leading-relaxed whitespace-pre-line">
        {note.reflection}
      </p>

      <div className="mx-3 flex items-center gap-2 border-t border-hairline py-3">
        <span className="mr-auto text-[15px] text-steel">{formatNoteDate(note.createdAt)}</span>
        {note.keywords.map((k) => (
          <span key={k} className="tag-chip">
            {k}
          </span>
        ))}
      </div>
    </Link>
  );
}
