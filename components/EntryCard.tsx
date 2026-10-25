import Link from "next/link";
import type { Entry } from "@/lib/entries";
import { findMood } from "@/lib/moods";

export function EntryCard({ entry }: { entry: Entry }) {
  const mood = findMood(entry.mood);
  return (
    <Link
      href={`/entries/${entry.id}`}
      className="card flex gap-4 p-4 transition-shadow hover:shadow-card sm:p-5"
    >
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-2 truncate text-[13px] text-steel">
          {entry.status === "to_read" && (
            <span className="rounded-sm bg-tint-yellow px-1.5 py-0.5 text-[12px] font-semibold text-charcoal">
              읽을 예정
            </span>
          )}
          <span className="truncate">{entry.siteName}</span>
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug">{entry.title}</h3>
        {entry.summary && (
          <p className="mt-1.5 line-clamp-2 text-[15px] text-charcoal">{entry.summary}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {mood && (
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-md text-xl ${mood.tint}`}
          title={mood.label}
          aria-label={mood.label}
        >
          {mood.emoji}
        </span>
      )}
    </Link>
  );
}
