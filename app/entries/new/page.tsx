import type { Metadata } from "next";
import Link from "next/link";
import { EntryForm } from "@/components/EntryForm";
import { UrlInput } from "@/components/UrlInput";
import { todayKey } from "@/lib/dates";
import { findEntryIdByUrl, listTags, type EntryInput } from "@/lib/entries";
import { fetchArticleMetadata, normalizeUrl } from "@/lib/metadata";

export const metadata: Metadata = { title: "새 기록" };
export const dynamic = "force-dynamic";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url: rawUrl } = await searchParams;

  if (!rawUrl) {
    return (
      <div>
        <h1 className="mb-2 text-[28px] font-semibold tracking-[-0.5px]">새 기록</h1>
        <p className="mb-6 text-slate">읽은 글의 URL부터 붙여넣어 주세요.</p>
        <UrlInput autoFocus />
      </div>
    );
  }

  const url = normalizeUrl(rawUrl);
  if (!url) {
    return (
      <div>
        <h1 className="mb-2 text-[28px] font-semibold tracking-[-0.5px]">새 기록</h1>
        <p className="mb-6 rounded-md bg-tint-peach px-4 py-3 text-sm text-charcoal">
          ⚠️ “{rawUrl}”은(는) 올바른 URL이 아니에요. 다시 확인해 주세요.
        </p>
        <UrlInput autoFocus />
      </div>
    );
  }

  const [meta, existingId] = await Promise.all([
    fetchArticleMetadata(url),
    Promise.resolve(findEntryIdByUrl(url)),
  ]);

  const initial: EntryInput = {
    ...meta.article,
    summary: "",
    reflection: "",
    mood: null,
    status: "read",
    readOn: todayKey(),
    quotes: [],
    tags: [],
  };

  return (
    <div>
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.5px]">새 기록</h1>
      {existingId && (
        <p className="mb-4 rounded-md bg-tint-sky px-4 py-3 text-sm text-charcoal">
          이미 기록한 글이에요.{" "}
          <Link href={`/entries/${existingId}`} className="font-medium text-link underline">
            이전 기록 보기
          </Link>{" "}
          · 다시 읽고 새로 남겨도 괜찮아요.
        </p>
      )}
      <EntryForm
        initial={initial}
        metaError={meta.ok ? undefined : meta.error}
        tagSuggestions={listTags().map((t) => t.name)}
      />
    </div>
  );
}
