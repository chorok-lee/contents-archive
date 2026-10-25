import type { Metadata } from "next";
import Link from "next/link";
import { EntryCard } from "@/components/EntryCard";
import { formatDateLabel, formatMonthLabel } from "@/lib/dates";
import { listEntries, listMonths, listTags, type Entry, type EntryStatus } from "@/lib/entries";

export const metadata: Metadata = { title: "아카이브" };
export const dynamic = "force-dynamic";

interface Filters {
  q?: string;
  tag?: string;
  month?: string;
  status?: EntryStatus;
}

function href(current: Filters, change: Partial<Filters>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...change })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/archive?${qs}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters: Filters = {
    q: raw.q?.trim() || undefined,
    tag: raw.tag || undefined,
    month: /^\d{4}-\d{2}$/.test(raw.month ?? "") ? raw.month : undefined,
    status: raw.status === "read" || raw.status === "to_read" ? raw.status : undefined,
  };

  const entries = listEntries(filters);
  const tags = listTags();
  const months = listMonths();
  const filtered = Boolean(filters.q || filters.tag || filters.month || filters.status);

  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    groups.set(entry.readOn, [...(groups.get(entry.readOn) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold tracking-[-0.5px]">아카이브</h1>

      <form action="/archive" role="search">
        {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
        {filters.month && <input type="hidden" name="month" value={filters.month} />}
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <label htmlFor="archive-search" className="sr-only">
          검색
        </label>
        <input
          id="archive-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="🔍 제목, 요약, 느낀 점, 인용, 태그 검색"
          className="input input-search"
        />
      </form>

      <div className="flex flex-col gap-3">
        <FilterRow>
          {(
            [
              [undefined, "전체"],
              ["read", "읽음"],
              ["to_read", "읽을 예정"],
            ] as const
          ).map(([status, label]) => (
            <Link key={label} href={href(filters, { status })} aria-current={filters.status === status} className="pill-tab">
              {label}
            </Link>
          ))}
          {months.length > 0 && <span className="mx-1 w-px self-stretch bg-hairline" aria-hidden />}
          {months.map((month) => (
            <Link
              key={month}
              href={href(filters, { month: filters.month === month ? undefined : month })}
              aria-current={filters.month === month}
              className="pill-tab"
            >
              {formatMonthLabel(month)}
            </Link>
          ))}
        </FilterRow>
        {tags.length > 0 && (
          <FilterRow>
            {tags.map(({ name, count }) => (
              <Link
                key={name}
                href={href(filters, { tag: filters.tag === name ? undefined : name })}
                className={`tag-chip shrink-0 ${filters.tag === name ? "ring-2 ring-primary" : "hover:underline"}`}
              >
                #{name} <span className="font-normal opacity-60">{count}</span>
              </Link>
            ))}
          </FilterRow>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-steel">
        <span>{entries.length}개의 기록</span>
        {filtered && (
          <Link href="/archive" className="font-medium text-link">
            필터 초기화
          </Link>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center text-steel">
          {filtered ? "조건에 맞는 기록이 없어요." : "아직 기록이 없어요."}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups].map(([day, dayEntries]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold text-slate">{formatDateLabel(day)}</h2>
              <div className="flex flex-col gap-3">
                {dayEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {children}
    </div>
  );
}
