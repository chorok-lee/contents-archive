-- Readlog schema. Run once in the Supabase SQL Editor (or with `supabase db push`).

create table if not exists public.articles (
  id            bigint generated always as identity primary key,
  url           text not null unique,
  title         text not null,
  site_name     text,
  image         text,
  description   text,
  body_text     text not null default '',
  summary       text[] not null default '{}',
  summarized_by text not null default 'rule' check (summarized_by in ('ai', 'rule')),
  fetched_at    timestamptz not null default now()
);

create table if not exists public.notes (
  id          bigint generated always as identity primary key,
  article_id  bigint not null references public.articles(id) on delete cascade,
  reflection  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notes_created_at on public.notes (created_at desc);
create index if not exists notes_article_id on public.notes (article_id);

create table if not exists public.note_keywords (
  note_id  bigint not null references public.notes(id) on delete cascade,
  keyword  text not null,
  primary key (note_id, keyword)
);
create index if not exists note_keywords_keyword on public.note_keywords (keyword);

-- RLS on with no policies: the browser-facing publishable/anon key can read nothing.
-- The app reads and writes only from the server with the secret key, which bypasses RLS.
alter table public.articles enable row level security;
alter table public.notes enable row level security;
alter table public.note_keywords enable row level security;
