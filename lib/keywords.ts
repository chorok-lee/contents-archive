/** Fixed keyword categories shown as chips. Order here is the chip order. */
export const KEYWORDS = [
  "AI",
  "생산성",
  "시간관리",
  "조직문화",
  "디자인",
  "개발",
  "커리어",
  "리더십",
  "비즈니스",
  "마케팅",
  "자기계발",
  "기타",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

export function isKeyword(value: unknown): value is Keyword {
  return KEYWORDS.includes(value as Keyword);
}

/** Words that signal each category, used when no API key is configured. */
const SIGNALS: Record<Exclude<Keyword, "기타">, string[]> = {
  AI: ["ai", "llm", "gpt", "claude", "인공지능", "머신러닝", "딥러닝", "생성형", "에이전트", "agent", "프롬프트"],
  생산성: ["생산성", "productivity", "효율", "업무 방식", "자동화", "워크플로", "workflow", "도구", "노션"],
  시간관리: ["시간 관리", "시간관리", "일정", "루틴", "습관", "집중", "우선순위", "마감", "time management", "focus"],
  조직문화: ["조직문화", "조직 문화", "팀워크", "협업", "회고", "피드백", "온보딩", "채용", "culture", "동료"],
  디자인: ["디자인", "design", "ux", "ui", "사용자 경험", "디자이너", "프로토타입", "피그마", "figma", "디자인 시스템"],
  개발: ["개발", "개발자", "코드", "프로그래밍", "엔지니어", "engineering", "software", "api", "프론트엔드", "백엔드"],
  커리어: ["커리어", "career", "이직", "연봉", "면접", "성장", "포트폴리오", "직무", "승진"],
  리더십: ["리더십", "leadership", "리더", "매니저", "관리자", "의사결정", "코칭", "1on1", "원온원"],
  비즈니스: ["비즈니스", "business", "스타트업", "전략", "매출", "시장", "투자", "수익", "고객", "프로덕트"],
  마케팅: ["마케팅", "marketing", "브랜딩", "브랜드", "광고", "콘텐츠", "그로스", "growth", "seo", "카피"],
  자기계발: ["자기계발", "독서", "글쓰기", "배움", "공부", "마인드셋", "동기", "회복", "건강"],
};

function countOccurrences(haystack: string, needle: string): number {
  // Short ASCII signals ("ai", "ui") must be whole words to avoid matching inside other words.
  if (/^[a-z0-9]{1,3}$/.test(needle)) {
    return (haystack.match(new RegExp(`\\b${needle}\\b`, "g")) ?? []).length;
  }
  let count = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) {
    count++;
  }
  return count;
}

/** Picks up to three categories by signal-word frequency; the reflection counts double. */
export function ruleKeywords(body: string, reflection: string): Keyword[] {
  const article = body.toLowerCase();
  const mine = reflection.toLowerCase();
  const scored = Object.entries(SIGNALS)
    .map(([keyword, words]) => ({
      keyword: keyword as Keyword,
      score: words.reduce(
        (sum, w) => sum + countOccurrences(article, w) + 2 * countOccurrences(mine, w),
        0,
      ),
    }))
    .filter((s) => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.keyword);
  return scored.length ? scored : ["기타"];
}
