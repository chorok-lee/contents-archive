import ogs from "open-graph-scraper";
import type { ArticleFields } from "./entries";

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|igshid$|mc_|ref$|ref_src$)/;

/** Adds a scheme if missing, drops tracking params and the hash. Returns null if not an http(s) URL. */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  return url.toString();
}

/** Rough reading time: ~500 Hangul characters or ~230 other words per minute. */
export function estimateReadingMinutes(html: string): number | null {
  const text = html
    .replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  const hangul = (text.match(/[가-힣]/g) ?? []).length;
  const words = text
    .replace(/[가-힣]/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w)).length;
  const minutes = Math.round(hangul / 500 + words / 230);
  return minutes > 0 ? minutes : null;
}

function absolute(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function clean(value: string | undefined | null): string | null {
  const v = value?.replace(/\s+/g, " ").trim();
  return v ? v : null;
}

export type MetadataResult =
  | { ok: true; article: ArticleFields }
  | { ok: false; article: ArticleFields; error: string };

export async function fetchArticleMetadata(url: string): Promise<MetadataResult> {
  const fallback: ArticleFields = {
    url,
    title: "",
    description: null,
    image: null,
    siteName: new URL(url).hostname.replace(/^www\./, ""),
    author: null,
    publishedAt: null,
    readingMinutes: null,
  };

  try {
    const { error, result, html } = await ogs({
      url,
      timeout: 8,
      fetchOptions: {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          "accept-language": "ko,en;q=0.8",
        },
      },
    });
    if (error) throw new Error("metadata request failed");

    const title =
      clean(result.ogTitle) ?? clean(result.twitterTitle) ?? clean(result.dcTitle);
    const article: ArticleFields = {
      url,
      title: title ?? "",
      description:
        clean(result.ogDescription) ?? clean(result.twitterDescription),
      image: absolute(result.ogImage?.[0]?.url ?? result.twitterImage?.[0]?.url, url),
      siteName: clean(result.ogSiteName) ?? fallback.siteName,
      author: clean(result.articleAuthor) ?? clean(result.author),
      publishedAt: clean(result.articlePublishedTime) ?? clean(result.ogDate),
      readingMinutes: html ? estimateReadingMinutes(html) : null,
    };
    if (!title) {
      return { ok: false, article, error: "글 제목을 찾지 못했어요. 직접 입력해 주세요." };
    }
    return { ok: true, article };
  } catch {
    return {
      ok: false,
      article: fallback,
      error: "글 정보를 불러오지 못했어요. 제목을 직접 입력해 주세요.",
    };
  }
}
