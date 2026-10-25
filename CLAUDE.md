# Readlog

읽은 아티클과 느낀 점을 기록하는 개인 아카이브. Next.js (App Router) + better-sqlite3 + Tailwind v4.

## UI 작업 규칙
- 화면을 만들거나 고칠 때는 **`DESIGN.md`의 토큰과 Do's/Don'ts를 따른다.** 토큰은 `app/globals.css`의 `@theme`에 옮겨 두었으니 임의의 hex 값 대신 `bg-primary`, `text-slate`, `border-hairline`, `rounded-lg` 같은 클래스를 쓴다.
- 공통 스타일은 `globals.css`의 `.btn`, `.input`, `.card`, `.pill-tab`, `.tag-chip`, `.segmented-tab`을 재사용한다.
- 버튼은 8px 직사각형(pill 금지), 카드는 12px, 보라색(`primary`)은 주요 CTA에만, 링크는 `text-link`.
- 브랜드 로고·이름은 쓰지 않는다. DESIGN.md는 분위기 참고용이다.

## 구조
- `lib/db.ts` 스키마·연결, `lib/entries.ts` 조회·저장, `lib/metadata.ts` URL → OG 메타데이터
- `app/actions.ts` 서버 액션, 화면은 `app/` 아래, 공통 컴포넌트는 `components/`

## 확인
- `npm run lint`, `npm run build`
- DB 파일은 `data/readlog.db` (`READLOG_DB`로 경로 변경 가능)
