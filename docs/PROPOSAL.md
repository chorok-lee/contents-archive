# 아티클 아카이빙 서비스 기획안 (Readlog)

## 배경
- 매일 아티클을 1~2개 읽고 느낀 점을 기록하는데, 기록이 흩어져 있어 다시 찾거나 돌아보기가 어렵다.
- v1 MVP는 요약·감정·인용·태그·상태·날짜까지 입력할 게 많아 **기록 자체가 부담**이 됐다.
- v2 목표: 사용자가 쓰는 건 **URL과 느낀 점 두 가지뿐**. 나머지는 자동.

## 1. 핵심 플로우

### 등록
1. 빈 홈 화면의 입력창에 URL을 붙여넣는다.
2. 붙이는 즉시 본문을 읽어 **최대 3줄 자동 요약**을 보여준다.
3. 하단에 느낀 점을 쓴다.
4. 저장하기.
   - 백엔드: 저장 시 **본문 + 느낀 점**을 보고 키워드를 추출해 붙인다.

### 모아보기
- `전체` 탭: 최근 저장한 메모가 맨 위에 오는 타임라인(날짜별 묶음).
- 상단 키워드 칩스로 키워드별 탐색: AI, 생산성, 시간관리, 조직문화, 디자인, 개발, 커리어, 리더십, 비즈니스, 마케팅, 자기계발, 기타.
- 카드를 누르면 상세: 원문 링크, 3줄 요약, 느낀 점 수정·삭제.

## 2. 자동화 방식
| 항목 | Claude API 키가 있을 때 | 키가 없거나 실패할 때 |
|---|---|---|
| 3줄 요약 | Claude가 본문을 읽고 한국어 3문장 | 글 설명 + 본문 앞 문장 3개 |
| 키워드 | 고정 목록 중 1~3개를 Claude가 선택 | 키워드별 단어 사전 매칭(느낀 점 가중치 2배), 없으면 `기타` |

- 같은 URL은 요약을 캐시해 다시 붙여넣어도 재요청하지 않는다.
- 느낀 점을 고치면 키워드를 다시 뽑는다.

## 3. 데이터 모델
```
articles      { id, url(unique), title, site_name, image, description, body_text, summary(text[]), summarized_by, fetched_at }
notes         { id, article_id, reflection, created_at, updated_at }
note_keywords { note_id, keyword }
```

## 4. 기술 스택
- Next.js (App Router) + TypeScript, Tailwind v4
- Supabase(Postgres) 저장, Vercel 배포. 연결 방법은 [SUPABASE.md](./SUPABASE.md)
- 본문 추출: `@mozilla/readability` + `linkedom`
- 요약·키워드: Claude API(`@anthropic-ai/sdk`, 구조화 출력)

## 5. 디자인 시스템
후보와 URL은 [DESIGN_SOURCES.md](./DESIGN_SOURCES.md)에 정리했다. awesome-design-md의 Notion 스타일(`/DESIGN.md`)을 쓰고 있다.

## 6. 다음에 고려할 것
- "N일 전 오늘" 다시 보기, 주간 회고
- 브라우저 확장·모바일 공유 시트로 URL 보내기
- 접근 보호(비밀번호 또는 Supabase Auth)
