import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditNote } from "@/components/EditNote";
import { getNote, isStorageConfigured } from "@/lib/notes";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  const n = Number(id);
  return isStorageConfigured() && Number.isInteger(n) && n > 0 ? getNote(n) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const note = await load((await params).id);
  return { title: note?.article.title ?? "기록" };
}

export default async function NotePage({ params }: Params) {
  const note = await load((await params).id);
  if (!note) notFound();
  const { article } = note;

  return (
    <EditNote
      id={note.id}
      reflection={note.reflection}
      bookmark={{
        url: article.url,
        title: article.title,
        siteName: article.siteName,
        image: article.image,
        summary: article.summary,
      }}
    />
  );
}
