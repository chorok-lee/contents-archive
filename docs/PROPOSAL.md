# 아티클 아카이빙 서비스 기획안 (가칭: Readlog)

## 배경
- 매일 아티클을 1~2개 읽고 느낀 점을 기록하는데, 기록이 흩어져 있어 다시 찾거나 돌아보기가 어렵다.
- 목표: **URL을 붙여넣고, 정보가 자동으로 채워지고, 느낀 점을 적기**까지 30초 안에 끝나고, 쌓인 기록을 쉽게 돌아볼 수 있는 개인용 아카이브.

## 1. 핵심 사용자 흐름
1. **붙여넣기**: 홈 상단 입력창에 URL을 붙여넣는다. 클립보드에 URL이 있으면 먼저 제안한다.
2. **자동 카드화**: 서버가 OG 메타데이터(제목, 썸네일, 사이트명, 작성자, 발행일)를 가져오고 본문 길이로 읽기 시간을 추정한다.
3. **기록**: 카드 바로 아래에서 작성한다.
   - 한 줄 요약 (필수, 140자 이내)
   - 느낀 점 (마크다운, 자유 형식)
   - 인상 깊은 문장 (여러 개)
   - 태그, 감정 이모지(💡🤔🔥😐) 또는 별점
   - 상태: 읽을 예정 / 읽음
4. **돌아보기**: 타임라인, 캘린더, 태그로 탐색하고 검색한다.

## 2. 기능 범위

### MVP (v1)
| 기능 | 설명 |
|---|---|
| URL 저장 + 메타데이터 추출 | 서버에서 가져오고, 실패하면 직접 입력 |
| 기록 에디터 | 요약, 느낀 점(마크다운), 인용, 태그, 감정 |
| 피드(타임라인) | 날짜별로 묶은 카드 목록 |
| 검색·필터 | 제목, 본문, 태그 전문 검색 |
| 잔디 캘린더 | 매일 기록했는지 GitHub 잔디처럼 표시 |
| 로그인 | Google 또는 이메일 매직링크 |

### v2 이후
- **"N일 전 오늘"**: 과거 기록 다시 보기
- 주간·월간 회고 리포트: 읽은 수, 많이 쓴 태그, 자주 나온 키워드
- AI 보조: 아티클 3줄 요약, 내 기록과 연관된 아티클 연결
- 브라우저 확장, 모바일 공유 시트로 저장 ("읽을 예정" 큐)
- 기록 공유 링크, Notion·Markdown 내보내기

## 3. 화면 구성
| 경로 | 화면 |
|---|---|
| `/` | 홈: URL 입력창, 오늘의 기록, 잔디 |
| `/entries/new?url=` | 기록 작성 |
| `/entries/[id]` | 상세: 아티클 카드, 느낀 점, 인용 |
| `/archive` | 전체 목록: 검색, 태그, 월별 필터 |
| `/insights` | 통계·회고 (v2) |

## 4. 데이터 모델
```
Article  { id, url(unique), title, description, image, siteName, author, publishedAt, readingMinutes }
Entry    { id, articleId, userId, summary, reflection(md), mood, rating, status, readAt, createdAt, updatedAt }
Quote    { id, entryId, text, order }
Tag      { id, userId, name }
EntryTag { entryId, tagId }
```

## 5. 기술 스택 (제안)
- **Next.js (App Router) + TypeScript**: 서버에서 메타데이터 추출 (`open-graph-scraper` 또는 `metascraper`)
- **Supabase**: Postgres, 인증, 전문 검색. 로컬에서만 쓸 거라면 SQLite + Drizzle
- **Tailwind CSS** + 선택한 디자인 시스템의 토큰(CSS 변수)
- 배포: Vercel

## 6. 디자인 시스템
후보와 URL은 [DESIGN_SOURCES.md](./DESIGN_SOURCES.md)에 정리했다. MVP는 awesome-design-md의 Notion 스타일(`/DESIGN.md`)로 시작했다.

## 7. 다음 단계
1. 디자인 시스템 결정 → 토큰과 폰트 설정
2. Next.js 프로젝트 생성, DB 스키마, 메타데이터 추출 API
3. 홈, 작성, 상세, 아카이브 화면 구현
4. 실제 아티클 URL로 저장 → 기록 → 검색 흐름 확인
