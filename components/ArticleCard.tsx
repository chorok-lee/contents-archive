import { formatPublished } from "@/lib/dates";
import type { ArticleFields } from "@/lib/entries";

export function ArticleCard({ article }: { article: ArticleFields }) {
  const meta = [
    article.author,
    formatPublished(article.publishedAt),
    article.readingMinutes ? `${article.readingMinutes}분 분량` : null,
  ].filter(Boolean);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex overflow-hidden transition-shadow hover:shadow-card"
    >
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <p className="mb-1 truncate text-[13px] text-steel">
          {article.siteName ?? new URL(article.url).hostname} ↗
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:underline">
          {article.title || article.url}
        </h3>
        {article.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate">{article.description}</p>
        )}
        {meta.length > 0 && (
          <p className="mt-2 text-[13px] text-stone">{meta.join(" · ")}</p>
        )}
      </div>
      {article.image && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
        <img
          src={article.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="hidden w-40 shrink-0 border-l border-hairline object-cover sm:block"
        />
      )}
    </a>
  );
}
