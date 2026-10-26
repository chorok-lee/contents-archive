import { isKeyword, KEYWORDS, type Keyword } from "./keywords";
import { getSupabase } from "./supabase";

export interface Article {
  id: number;
  url: string;
  title: string;
  siteName: string | null;
  image: string | null;
  description: string | null;
  bodyText: string;
  summary: string[];
  summarizedBy: "ai" | "rule";
}

export interface Note {
  id: number;
  reflection: string;
  createdAt: string;
  updatedAt: string;
  keywords: Keyword[];
  article: Omit<Article, "bodyText">;
}

interface ArticleRow {
  id: number;
  url: string;
  title: string;
  site_name: string | null;
  image: string | null;
  description: string | null;
  body_text: string;
  summary: string[];
  summarized_by: "ai" | "rule";
}

interface NoteRow {
  id: number;
  reflection: string;
  created_at: string;
  updated_at: string;
  article: Omit<ArticleRow, "body_text">;
  note_keywords: { keyword: string }[];
}

const ARTICLE_COLUMNS = "id, url, title, site_name, image, description, summary, summarized_by";
const NOTE_SELECT = `id, reflection, created_at, updated_at,
  article:articles!inner(${ARTICLE_COLUMNS}), note_keywords(keyword)`;

function fail(action: string, error: { message: string }): never {
  if (error.message.includes("fetch failed")) {
    throw new Error("데이터베이스에 연결하지 못했어요. SUPABASE_URL과 네트워크를 확인해 주세요.");
  }
  if (error.message.includes("Invalid API key")) {
    throw new Error("Supabase 키가 올바르지 않아요. SUPABASE_SECRET_KEY를 확인해 주세요.");
  }
  if (/relation .* does not exist|Could not find the table/.test(error.message)) {
    throw new Error("Supabase에 테이블이 없어요. supabase/migrations/0001_init.sql을 먼저 실행해 주세요.");
  }
  throw new Error(`Supabase ${action} 실패: ${error.message}`);
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    siteName: row.site_name,
    image: row.image,
    description: row.description,
    bodyText: row.body_text,
    summary: row.summary ?? [],
    summarizedBy: row.summarized_by,
  };
}

function toNote(row: NoteRow): Note {
  const keywords = row.note_keywords.map((k) => k.keyword);
  const a = row.article;
  return {
    id: row.id,
    reflection: row.reflection,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    keywords: KEYWORDS.filter((k) => keywords.includes(k)),
    article: {
      id: a.id,
      url: a.url,
      title: a.title,
      siteName: a.site_name,
      image: a.image,
      description: a.description,
      summary: a.summary ?? [],
      summarizedBy: a.summarized_by,
    },
  };
}

export async function getArticleByUrl(url: string): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("url", url)
    .maybeSingle<ArticleRow>();
  if (error) fail("글 조회", error);
  return data ? toArticle(data) : null;
}

export async function getArticle(id: number): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle<ArticleRow>();
  if (error) fail("글 조회", error);
  return data ? toArticle(data) : null;
}

export async function saveArticle(input: Omit<Article, "id">): Promise<Article> {
  const { data, error } = await getSupabase()
    .from("articles")
    .upsert(
      {
        url: input.url,
        title: input.title,
        site_name: input.siteName,
        image: input.image,
        description: input.description,
        body_text: input.bodyText,
        summary: input.summary,
        summarized_by: input.summarizedBy,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "url" },
    )
    .select("*")
    .single<ArticleRow>();
  if (error) fail("글 저장", error);
  return toArticle(data);
}

async function setKeywords(noteId: number, keywords: Keyword[]) {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase.from("note_keywords").delete().eq("note_id", noteId);
  if (deleteError) fail("키워드 정리", deleteError);
  if (!keywords.length) return;
  const { error } = await supabase
    .from("note_keywords")
    .insert(keywords.map((keyword) => ({ note_id: noteId, keyword })));
  if (error) fail("키워드 저장", error);
}

export async function createNote(
  articleId: number,
  reflection: string,
  keywords: Keyword[],
): Promise<number> {
  const { data, error } = await getSupabase()
    .from("notes")
    .insert({ article_id: articleId, reflection })
    .select("id")
    .single<{ id: number }>();
  if (error) fail("기록 저장", error);
  await setKeywords(data.id, keywords);
  return data.id;
}

export async function updateNote(id: number, reflection: string, keywords: Keyword[]): Promise<void> {
  const { error } = await getSupabase()
    .from("notes")
    .update({ reflection, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) fail("기록 수정", error);
  await setKeywords(id, keywords);
}

export async function deleteNote(id: number): Promise<void> {
  const { error } = await getSupabase().from("notes").delete().eq("id", id);
  if (error) fail("기록 삭제", error);
}

export async function getNote(id: number): Promise<Note | null> {
  const { data, error } = await getSupabase()
    .from("notes")
    .select(NOTE_SELECT)
    .eq("id", id)
    .maybeSingle<NoteRow>();
  if (error) fail("기록 조회", error);
  return data ? toNote(data) : null;
}

/** Newest first, optionally limited to one keyword. */
export async function listNotes(keyword?: Keyword): Promise<Note[]> {
  const supabase = getSupabase();
  let query = supabase.from("notes").select(NOTE_SELECT).order("created_at", { ascending: false });

  if (keyword) {
    const { data: links, error } = await supabase
      .from("note_keywords")
      .select("note_id")
      .eq("keyword", keyword);
    if (error) fail("키워드 조회", error);
    if (!links.length) return [];
    query = query.in(
      "id",
      links.map((l) => l.note_id),
    );
  }

  const { data, error } = await query.returns<NoteRow[]>();
  if (error) fail("기록 목록 조회", error);
  return data.map(toNote);
}

/** Keywords that have at least one note, in the fixed chip order. */
export async function keywordCounts(): Promise<{ keyword: Keyword; count: number }[]> {
  const { data, error } = await getSupabase().from("note_keywords").select("keyword");
  if (error) fail("키워드 집계", error);
  const counts = new Map<string, number>();
  for (const { keyword } of data) counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
  return KEYWORDS.flatMap((keyword) => {
    const count = counts.get(keyword);
    return count && isKeyword(keyword) ? [{ keyword, count }] : [];
  });
}

export async function findNoteIdByUrl(url: string): Promise<number | null> {
  const { data, error } = await getSupabase()
    .from("notes")
    .select("id, article:articles!inner(url)")
    .eq("article.url", url)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) fail("중복 확인", error);
  return data[0]?.id ?? null;
}
