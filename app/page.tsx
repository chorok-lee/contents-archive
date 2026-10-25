import Link from "next/link";
import { EntryCard } from "@/components/EntryCard";
import { StreakCalendar } from "@/components/StreakCalendar";
import { UrlInput } from "@/components/UrlInput";
import { todayKey } from "@/lib/dates";
import { getActivity, listEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const activity = getActivity();
  const recent = listEntries({ status: "read", limit: 5 });
  const queue = listEntries({ status: "to_read", limit: 5 });
  const readToday = activity.counts[todayKey()] ?? 0;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.5px] sm:text-[36px]">
          {readToday > 0 ? `오늘 ${readToday}개 읽었어요 👏` : "오늘은 무엇을 읽었나요?"}
        </h1>
        <p className="mt-2 mb-6 text-[17px] text-slate">
          URL을 붙여넣으면 글 정보는 알아서 채워져요. 느낀 점만 적으면 돼요.
        </p>
        <UrlInput autoFocus />
      </section>

      <StreakCalendar activity={activity} />

      {queue.length > 0 && (
        <EntrySection title="읽을 예정" href="/archive?status=to_read" entries={queue} />
      )}

      {recent.length > 0 ? (
        <EntrySection title="최근 기록" href="/archive" entries={recent} />
      ) : (
        <section className="rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center">
          <p className="text-3xl">📝</p>
          <p className="mt-3 font-medium">아직 기록이 없어요</p>
          <p className="mt-1 text-sm text-steel">오늘 읽은 글의 URL을 위에 붙여넣어 첫 기록을 남겨 보세요.</p>
        </section>
      )}
    </div>
  );
}

function EntrySection({
  title,
  href,
  entries,
}: {
  title: string;
  href: string;
  entries: ReturnType<typeof listEntries>;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-link hover:text-link-pressed">
          모두 보기
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
