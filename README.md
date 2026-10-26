# 📚 Readlog

읽은 글의 URL을 붙여넣고 느낀 점만 적으면 되는 개인 아카이브.

1. **등록** — 첫 화면에 URL을 붙여넣으면 바로 본문을 읽고 3줄로 요약한다. 아래에 느낀 점을 쓰고 저장.
2. **키워드** — 저장할 때 본문과 느낀 점을 보고 키워드(AI, 생산성, 시간관리, 조직문화, 디자인 등 12개 중 1~3개)를 자동으로 붙인다.
3. **모아보기** — 최근 저장한 메모가 위에 오는 타임라인. 상단 키워드 칩으로 골라 본다. 느낀 점은 상세 화면에서 고치거나 지울 수 있다(고치면 키워드를 다시 뽑는다).

## 실행

DB는 Supabase를 쓴다. 처음이라면 **[docs/SUPABASE.md](./docs/SUPABASE.md)**를 따라 프로젝트를 만들고 테이블을 생성한다.

```bash
npm install
cp .env.example .env.local   # SUPABASE_URL, SUPABASE_SECRET_KEY, (선택) ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

- `ANTHROPIC_API_KEY`가 있으면 Claude(`claude-opus-5-5`)가 요약과 키워드를 만든다. 없거나 호출이 실패하면 글 설명·첫 문장들로 요약하고, 단어 사전으로 키워드를 고른다.
- 같은 URL의 요약은 DB에 캐시돼 다시 붙여넣어도 API를 또 부르지 않는다.
- Vercel에 그대로 배포할 수 있다. 단, 아직 로그인이 없어서 URL을 아는 누구나 접근할 수 있다.

## 디자인

`DESIGN.md`는 [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)(MIT)의 Notion 스타일 파일이다. 커뮤니티가 공개 CSS에서 추출한 근사치이며 공식 자료가 아니다. 토큰은 `app/globals.css`로 옮겼고, 폰트는 Pretendard.

기획서와 디자인 시스템 후보는 [`docs/`](./docs)에 있다.
