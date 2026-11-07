# 📚 Readlog

읽은 글의 URL을 붙여넣고 느낀 점만 적으면 되는 개인 아카이브.

1. **링크 붙이기** — 홈의 「링크 붙이기」(목록에선 ＋)를 누르거나, 앱을 열 때 뜨는 클립보드 토스트를 누른다. 링크를 붙이면 바로 본문을 읽고 3줄로 요약한다.
2. **느낀 점 쓰기 / 나중에 읽기** — 요약을 보고 지금 느낀 점을 쓰거나(아래에 북마크가 클립처럼 붙는다), 「나중에 읽기」로 링크만 저장한다.
3. **목록** — 「읽은 글」에는 느낀 점을 쓴 기록이 최신순으로 쌓이고 키워드 칩으로 골라 본다. 「나중에 읽기」에는 링크만 저장한 글이 모이고, 열어서 느낀 점을 쓰면 읽은 글로 옮겨진다.

## 실행

DB는 Supabase를 쓴다. 처음이라면 **[docs/SUPABASE.md](./docs/SUPABASE.md)**를 따라 프로젝트를 만들고 테이블을 생성한다.

```bash
npm install
cp .env.example .env.local   # SUPABASE_URL, SUPABASE_SECRET_KEY, (선택) ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

- `ANTHROPIC_API_KEY`가 있으면 Claude(`claude-opus-5-5`)가 요약과 키워드를 만든다. 없거나 호출이 실패하면 글 설명·첫 문장들로 요약하고, 단어 사전으로 키워드를 고른다.
- 같은 URL의 요약은 DB에 캐시돼 다시 붙여넣어도 API를 또 부르지 않는다.
- Supabase 없이 화면만 보고 싶으면 `READLOG_FAKE_DB=1 npm run dev` (메모리 저장, 서버를 끄면 사라짐. 개발 모드에서만 동작).
- Vercel에 그대로 배포할 수 있다. 단, 아직 로그인이 없어서 URL을 아는 누구나 접근할 수 있다.

## 디자인

최신 iOS 앱 스타일(그룹 배경, 큰 제목, 원형 툴바 버튼, 바텀 시트). 토큰과 공통 클래스는 `app/globals.css`. 초기 참고로 쓴 `DESIGN.md`는 [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)(MIT)의 Notion 스타일 파일이다.

기획서와 디자인 시스템 후보는 [`docs/`](./docs)에 있다.
