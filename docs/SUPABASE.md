# Supabase 연결하기

Readlog는 기록을 Supabase(Postgres)에 저장한다. 처음 한 번만 아래 순서대로 설정하면 된다. 10분 정도 걸린다.

## 1. 프로젝트 만들기
1. https://supabase.com 에 로그인하고 **New project**를 누른다.
2. 이름(예: `readlog`), DB 비밀번호, 리전을 정한다. 리전은 가까운 **Northeast Asia (Seoul)**을 추천한다.
3. 프로젝트가 준비될 때까지 1~2분 기다린다.

## 2. 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**.
2. 이 레포의 [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) 내용을 통째로 붙여넣고 **Run**.
3. **Table Editor**에 `articles`, `notes`, `note_keywords` 세 테이블이 생겼는지 확인한다.

> 여러 번 실행해도 안전하다(`if not exists`). Supabase CLI를 쓴다면 `supabase link` 후 `supabase db push`로도 된다.

## 3. URL과 키 복사하기
**Project Settings**(톱니바퀴)에서 두 값을 찾는다. 메뉴 이름은 대시보드 버전에 따라 조금 다를 수 있다.

| 환경 변수 | 어디서 | 모양 |
|---|---|---|
| `SUPABASE_URL` | **Data API** (또는 상단 **Connect**) 의 Project URL | `https://abcd1234.supabase.co` |
| `SUPABASE_SECRET_KEY` | **API Keys** 의 **Secret key** (`sb_secret_…`). 예전 프로젝트라면 **Legacy API keys** 의 `service_role` 키 | 긴 문자열 |

⚠️ **publishable / anon 키가 아니라 secret(service_role) 키**를 써야 한다. 테이블에 RLS를 켜고 정책을 두지 않았기 때문에 anon 키로는 아무것도 읽거나 쓸 수 없다. secret 키는 RLS를 우회하는 관리자 키이므로 **서버에서만** 쓰이고(`lib/supabase.ts`가 `server-only`), 절대 `NEXT_PUBLIC_` 접두사를 붙이거나 깃에 올리지 않는다.

## 4. 로컬에서 실행
```bash
cp .env.example .env.local
# .env.local 에 SUPABASE_URL, SUPABASE_SECRET_KEY (선택: ANTHROPIC_API_KEY) 입력
npm run dev
```
http://localhost:3000 에서 URL을 붙여넣고 저장한 뒤, Supabase **Table Editor**의 `notes`에 행이 생겼는지 확인한다.

## 5. Vercel에 배포
1. Vercel에서 이 GitHub 레포를 Import.
2. **Settings → Environment Variables**에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`를 넣는다.
3. Deploy.

> ⚠️ 지금은 로그인이나 비밀번호가 없다. 배포 URL을 아는 사람은 누구나 기록을 보고 쓰고 지울 수 있다. URL을 공유하지 말고, 공개가 필요해지면 접근 보호(비밀번호 또는 Supabase Auth)를 먼저 추가하자.

## 문제 해결
| 화면 메시지 | 원인 |
|---|---|
| 데이터베이스가 아직 연결되지 않았어요 | 환경 변수 두 개 중 하나가 비어 있음. 넣고 서버 재시작 |
| Supabase 키가 올바르지 않아요 | 키를 잘못 복사했거나 anon 키를 넣음 |
| Supabase에 테이블이 없어요 | 2단계 SQL을 실행하지 않음 |
| 데이터베이스에 연결하지 못했어요 | URL 오타, 프로젝트 일시정지(무료 플랜은 7일 미사용 시 일시정지), 네트워크 |
