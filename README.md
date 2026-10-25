# 📚 Readlog

매일 읽은 아티클의 URL을 붙여넣고 느낀 점을 기록하는 개인 아카이브.

- URL만 붙여넣으면 제목·썸네일·사이트·작성자·읽는 시간을 자동으로 채움 (실패하면 직접 입력)
- 한 줄 요약, 느낀 점(마크다운), 인상 깊은 문장, 태그, 감정 기록
- "읽을 예정" 목록, 날짜별 아카이브, 검색·태그·월 필터
- 매일 기록 습관을 보여주는 잔디와 연속 기록 일수

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
```

데이터는 `data/readlog.db`(SQLite)에 저장된다. 백업은 이 파일을 복사하면 된다. 다른 경로를 쓰려면 `READLOG_DB=/path/to/readlog.db`.

> SQLite 파일 저장 방식이라 Vercel 같은 서버리스 환경에 배포하면 데이터가 유지되지 않는다. 배포가 필요해지면 Supabase(Postgres)로 옮긴다. `lib/entries.ts`만 바꾸면 되도록 저장 로직을 모아 두었다.

## 디자인

`DESIGN.md`는 [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)(MIT)의 Notion 스타일 파일을 그대로 가져온 것이다. 커뮤니티가 공개 CSS에서 추출한 근사치이며 공식 자료가 아니다. 토큰은 `app/globals.css`로 옮겼고, 한글 폰트는 Pretendard(Latin 글리프가 Inter 기반)를 쓴다.

기획서와 디자인 시스템 후보는 [`docs/`](./docs)에 있다.
