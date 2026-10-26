# Readlog

읽은 아티클과 느낀 점을 기록하는 개인 아카이브. Next.js (App Router) + better-sqlite3 + Tailwind v4.

## UI 작업 규칙
- 화면을 만들거나 고칠 때는 **`DESIGN.md`의 토큰과 Do's/Don'ts를 따른다.** 토큰은 `app/globals.css`의 `@theme`에 옮겨 두었으니 임의의 hex 값 대신 `bg-primary`, `text-slate`, `border-hairline`, `rounded-lg` 같은 클래스를 쓴다.
- 공통 스타일은 `globals.css`의 `.btn`, `.input`, `.card`, `.pill-tab`, `.tag-chip`을 재사용한다.
- 버튼은 8px 직사각형(pill 금지), 카드는 12px, 보라색(`primary`)은 주요 CTA에만, 링크는 `text-link`.
- 브랜드 로고·이름은 쓰지 않는다. DESIGN.md는 분위기 참고용이다.

## 제품 원칙
- 입력 부담을 최소로: 사용자가 쓰는 건 URL과 느낀 점뿐. 요약·키워드는 자동. 입력 필드를 늘리는 변경은 먼저 사용자에게 확인한다.

## 구조
- `lib/extract.ts` URL 정규화 + 본문 추출(Readability), `lib/ai.ts` 3줄 요약·키워드(Claude API, 키 없으면 규칙 기반 폴백)
- `lib/keywords.ts` 고정 키워드 목록과 폴백 사전, `lib/notes.ts` 조회·저장, `lib/db.ts` 스키마(`user_version`으로 버전 관리)
- `app/actions.ts` 서버 액션, 화면: `/` 등록, `/archive` 모아보기, `/notes/[id]` 상세

## 확인
- `npm run lint`, `npm run build`
- DB 파일은 `data/readlog.db` (`READLOG_DB`로 경로 변경 가능)
