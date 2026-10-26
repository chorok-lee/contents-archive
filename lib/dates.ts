/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "오늘", "어제", or "2026년 10월 24일 (토)" for a local date key. */
export function formatDateLabel(key: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (key === toDateKey(today)) return "오늘";
  if (key === toDateKey(yesterday)) return "어제";

  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = y === today.getFullYear();
  return `${sameYear ? "" : `${y}년 `}${m}월 ${d}일 (${WEEKDAYS[date.getDay()]})`;
}
