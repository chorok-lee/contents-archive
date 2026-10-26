import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|igshid$|mc_|ref$|ref_src$)/;
const MAX_HTML_BYTES = 5_000_000;

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

export interface FetchedArticle {
  url: string;
  title: string;
  siteName: string;
  image: string | null;
  description: string | null;
  bodyText: string;
}

function hostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function clean(value: string | null | undefined): string | null {
  const v = value?.replace(/\s+/g, " ").trim();
  return v ? v : null;
}

function absolute(value: string | null, base: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

/** Decodes with the charset from the header or <meta>, so EUC-KR pages read correctly. */
function decode(bytes: ArrayBuffer, contentType: string | null): string {
  const fromHeader = contentType?.match(/charset=([\w-]+)/i)?.[1];
  const head = new TextDecoder("latin1").decode(bytes.slice(0, 4096));
  const fromMeta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  const charset = fromHeader ?? fromMeta ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** Fetches a page and pulls out its Open Graph info and readable body text. */
export async function fetchArticle(url: string): Promise<FetchedArticle | null> {
  let html: string;
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "accept-language": "ko,en;q=0.8",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "text/html").includes("html")) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_HTML_BYTES) return null;
    html = decode(bytes, res.headers.get("content-type"));
    finalUrl = res.url || url;
  } catch {
    return null;
  }

  const { document } = parseHTML(html);
  const meta = (selector: string) =>
    clean(document.querySelector(selector)?.getAttribute("content"));

  const ogTitle =
    meta('meta[property="og:title"]') ??
    meta('meta[name="twitter:title"]') ??
    clean(document.querySelector("title")?.textContent);
  const description =
    meta('meta[property="og:description"]') ?? meta('meta[name="description"]');
  const siteName = meta('meta[property="og:site_name"]') ?? hostname(url);
  const image = absolute(
    meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]'),
    finalUrl,
  );

  // Readability mutates the document, so read the meta tags first.
  let bodyText = "";
  try {
    const parsed = new Readability(document as unknown as Document).parse();
    bodyText = (parsed?.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  } catch {
    bodyText = "";
  }

  return {
    url,
    title: ogTitle ?? hostname(url),
    siteName,
    image,
    description,
    bodyText,
  };
}
