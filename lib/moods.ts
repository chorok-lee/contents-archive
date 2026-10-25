export const MOODS = [
  { value: "insight", emoji: "💡", label: "인사이트", tint: "bg-tint-lavender" },
  { value: "question", emoji: "🤔", label: "생각거리", tint: "bg-tint-sky" },
  { value: "fire", emoji: "🔥", label: "강력 추천", tint: "bg-tint-peach" },
  { value: "meh", emoji: "😐", label: "그저 그럼", tint: "bg-tint-gray" },
] as const;

export type Mood = (typeof MOODS)[number]["value"];

export function findMood(value: string | null | undefined) {
  return MOODS.find((m) => m.value === value) ?? null;
}

export function isMood(value: unknown): value is Mood {
  return MOODS.some((m) => m.value === value);
}
