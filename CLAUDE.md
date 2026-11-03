# Readlog

읽은 아티클과 느낀 점을 기록하는 개인 아카이브. Next.js (App Router) + Supabase(Postgres) + Tailwind v4.

## UI 작업 규칙 (iOS 스타일)
- 최신 iOS 앱 느낌: 회색 그룹 배경(`bg-surface`) 위 흰 카드(`.card`, 24px), Large Title(34px bold), 시스템 폰트.
- 토큰은 `app/globals.css`의 `@theme`에만 정의한다. 임의 hex 대신 `bg-primary`, `bg-tint`, `bg-fill`, `text-steel`, `border-hairline` 같은 클래스를 쓴다.
- 버튼: 원형 툴바 버튼 `.glass-btn`(뒤로·삭제), 주요 동작 `.round-primary`(✓, ＋ FAB), 시트의 큰 CTA `.btn btn-dark`. 칩은 `.pill-tab`, 키워드는 `.tag-chip`.
- 화면 구조: `/` 기록 피드 + ＋ FAB → 링크 시트(`LinkSheet`) → 느낀 점 에디터(`NoteEditor`, 하단 `BookmarkClip`). 수정은 `/notes/[id]`에서 같은 에디터.
- 눌림 피드백(`active:scale`)과 safe-area 여백(`env(safe-area-inset-*)`)을 유지한다.
- `DESIGN.md`(Notion 스타일)는 초기 참고 자료로만 남아 있다. 지금 규칙은 이 섹션이 우선.

## 제품 원칙
- 입력 부담을 최소로: 사용자가 쓰는 건 URL과 느낀 점뿐. 요약·키워드는 자동. 입력 필드를 늘리는 변경은 먼저 사용자에게 확인한다.

## 구조
- `lib/extract.ts` URL 정규화 + 본문 추출(Readability), `lib/ai.ts` 3줄 요약·키워드(Claude API, 키 없으면 규칙 기반 폴백)
- `lib/keywords.ts` 고정 키워드 목록과 폴백 사전, `lib/notes.ts` 조회·저장(supabase-js), `lib/supabase.ts` 서버 전용 클라이언트(secret 키)
- 스키마는 `supabase/migrations/`의 SQL. 바꿀 때는 새 번호 파일을 추가하고 `docs/SUPABASE.md`도 갱신
- `lib/notes.ts`는 저장소 선택만 한다: 기본 Supabase(`notes.supabase.ts`), 개발 중 `READLOG_FAKE_DB=1`이면 메모리(`notes.memory.ts`, 재시작 시 초기화)
- `app/actions.ts` 서버 액션, 화면: `/` 피드(키워드 칩 `?k=`), `/notes/[id]` 수정

## 확인
- `npm run lint`, `npm run build`
- 환경 변수: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, (선택) `ANTHROPIC_API_KEY`. 설정법은 `docs/SUPABASE.md`
- secret 키는 RLS를 우회하므로 서버 코드에서만 쓴다. 클라이언트 컴포넌트에서 `lib/supabase.ts`·`lib/notes.ts`를 import하지 않는다
