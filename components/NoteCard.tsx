import Link from "next/link";
import type { Note } from "@/lib/notes";

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-card sm:p-5"
    >
      <p className="line-clamp-3 text-[16px] leading-relaxed whitespace-pre-line text-ink">
        {note.reflection}
      </p>
      <div className="flex items-center gap-2 border-t border-hairline-soft pt-3 text-[13px] text-steel">
        <span className="shrink-0">📄</span>
        <span className="truncate">
          <span className="font-medium text-charcoal">{note.article.title}</span>
          {note.article.siteName && <span> · {note.article.siteName}</span>}
        </span>
      </div>
      {note.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.keywords.map((k) => (
            <span key={k} className="tag-chip">
              #{k}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
