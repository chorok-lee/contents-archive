// Dates render on the server (UTC on Vercel), so format in the reader's zone explicitly.
const TIME_ZONE = process.env.READLOG_TZ ?? "Asia/Seoul";

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
const longDate = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "long",
});
const longDateWithYear = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

/** "오늘", "어제", "11월 3일 월요일", or with the year when it isn't this year. */
export function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const key = dayKey.format(date);
  if (key === dayKey.format(now)) return "오늘";
  if (key === dayKey.format(new Date(now.getTime() - 86_400_000))) return "어제";
  return key.slice(0, 4) === dayKey.format(now).slice(0, 4)
    ? longDate.format(date)
    : longDateWithYear.format(date);
}
