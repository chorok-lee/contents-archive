import { fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { Activity } from "@/lib/entries";

const WEEKS = 53;
const MOBILE_WEEKS = 17;

function cellColor(count: number): string {
  if (count === 0) return "var(--color-hairline-soft)";
  if (count === 1) return "color-mix(in srgb, var(--color-primary) 35%, white)";
  if (count === 2) return "color-mix(in srgb, var(--color-primary) 65%, white)";
  return "var(--color-primary)";
}

export function StreakCalendar({ activity }: { activity: Activity }) {
  const today = todayKey();
  const start = fromDateKey(today);
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);

  const weeks: { key: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor);
      days.push({ key, count: activity.counts[key] ?? 0, future: key > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return (
    <section className="rounded-lg bg-surface p-5 sm:p-6">
      <div className="mb-5 grid grid-cols-3 gap-2">
        <Stat label="연속 기록" value={`${activity.streak}일`} highlight={activity.streak > 0} />
        <Stat label="이번 달" value={`${activity.thisMonth}개`} />
        <Stat label="전체" value={`${activity.total}개`} />
      </div>
      <div className="flex justify-end gap-[3px] md:gap-[2px]" aria-label="최근 1년 기록 잔디">
        {weeks.map((days, i) => (
          <div
            key={days[0].key}
            className={`flex flex-col gap-[3px] md:gap-[2px] ${i < WEEKS - MOBILE_WEEKS ? "hidden md:flex" : ""}`}
          >
            {days.map((day) => (
              <span
                key={day.key}
                title={day.future ? undefined : `${day.key} · ${day.count}개`}
                className="block size-[11px] rounded-[2px] md:size-[10px]"
                style={{ backgroundColor: day.future ? "transparent" : cellColor(day.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[13px] text-steel">{label}</p>
      <p className={`text-[22px] font-semibold tracking-tight ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
