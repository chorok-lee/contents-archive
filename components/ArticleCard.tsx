interface Props {
  article: { url: string; title: string; siteName: string | null; image: string | null };
  compact?: boolean;
}

export function ArticleCard({ article, compact = false }: Props) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex overflow-hidden transition-shadow hover:shadow-card"
    >
      <div className={`min-w-0 flex-1 ${compact ? "px-4 py-3" : "p-4 sm:p-5"}`}>
        <p className="mb-1 truncate text-[13px] text-steel">
          {article.siteName ?? new URL(article.url).hostname} ↗
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:underline">
          {article.title}
        </h3>
      </div>
      {article.image && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts
        <img
          src={article.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`shrink-0 border-l border-hairline object-cover ${compact ? "hidden" : "w-28 sm:w-40"}`}
        />
      )}
    </a>
  );
}
