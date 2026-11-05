import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|igshid$|mc_|ref$|ref_src$)/;
const MAX_HTML_BYTES = 5_000_000;

// Some Korean blog platforms reject requests that don't look like a real browser.
const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
};

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

const MAX_REDIRECTS = 5;
const LOGIN_PATH = /\/(auth|login|signin|oauth)\b/i;
const LOGIN_HOST = /^(kauth\.kakao\.com|nid\.naver\.com|accounts\.google\.com)$/i;

export type FetchFailure = "login" | "unavailable";

/** Follows redirects by hand so a detour through a login page is reported instead of followed. */
async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | FetchFailure> {
  const host = new URL(url).hostname;
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: BROWSER_HEADERS,
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        const next = new URL(location, current);
        if (LOGIN_HOST.test(next.hostname) || LOGIN_PATH.test(next.pathname)) {
          console.warn(`[readlog] fetch ${host} redirects to login ${next.hostname}${next.pathname}`);
          return "login";
        }
        current = next.toString();
        continue;
      }
      const type = res.headers.get("content-type") ?? "text/html";
      if (!res.ok || !type.includes("html")) {
        console.warn(`[readlog] fetch ${host} status=${res.status} type=${type}`);
        return "unavailable";
      }
      const bytes = await res.arrayBuffer();
      if (bytes.byteLength > MAX_HTML_BYTES) {
        console.warn(`[readlog] fetch ${host} too large bytes=${bytes.byteLength}`);
        return "unavailable";
      }
      return { html: decode(bytes, type), finalUrl: current };
    }
    console.warn(`[readlog] fetch ${host} too many redirects`);
    return "unavailable";
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(`[readlog] fetch ${host} failed ${reason}`);
    return "unavailable";
  }
}

/** Plain text of an HTML fragment with one line per paragraph-like block. */
function blockText(html: string): string {
  const spaced = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|figcaption|pre|tr)>/gi, "$&\n");
  const { document } = parseHTML(`<!doctype html><html><body>${spaced}</body></html>`);
  return (document.body?.textContent ?? "")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Fetches a page and pulls out its Open Graph info and readable body text. */
export async function fetchArticle(url: string): Promise<FetchedArticle | FetchFailure> {
  const fetched = await fetchHtml(url);
  if (typeof fetched === "string") return fetched;
  const { html, finalUrl } = fetched;

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
    bodyText = parsed?.content ? blockText(parsed.content) : "";
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
