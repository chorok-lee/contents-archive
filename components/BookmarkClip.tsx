"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "./icons";

export interface Bookmark {
  url: string;
  title: string;
  siteName: string | null;
  image: string | null;
  summary: string[];
}

/** The article attached to a note, shown under the editor. Tap to show the 3-line summary. */
export function BookmarkClip({ bookmark, compact = false }: { bookmark: Bookmark; compact?: boolean }) {
  const [expanded, setOpen] = useState(false);
  // While typing (keyboard up) the clip stays one line so the text keeps its room.
  const open = expanded && !compact;
  const hasSummary = bookmark.summary.length > 0;

  return (
    <div className="rounded-xl bg-canvas/85 p-2 shadow-float backdrop-blur-xl">
      <div className="flex items-center gap-3 rounded-lg bg-tint p-2 pr-3">
        {bookmark.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
          <img
            src={bookmark.image}
            alt=""
            referrerPolicy="no-referrer"
            className="size-12 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-canvas text-xl">
            🔖
          </span>
        )}
        <button
          type="button"
          onClick={() => hasSummary && setOpen((o) => !o)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[13px] font-medium text-primary">
            {bookmark.siteName ?? new URL(bookmark.url).hostname}
          </p>
          <p className="truncate text-[15px] font-semibold text-charcoal">{bookmark.title}</p>
        </button>
        {hasSummary && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "요약 접기" : "요약 보기"}
            className="text-steel"
          >
            <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="원문 열기"
          className="text-steel"
        >
          <ArrowUpRight size={20} />
        </a>
      </div>
      {open && (
        <ol className="animate-fade-in flex flex-col gap-1.5 px-3 pt-3 pb-2 text-[15px] leading-relaxed text-slate">
          {bookmark.summary.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-stone">{i + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
