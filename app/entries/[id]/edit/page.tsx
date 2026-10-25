import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { getEntry, listTags } from "@/lib/entries";

export const metadata: Metadata = { title: "기록 수정" };
export const dynamic = "force-dynamic";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const entry = Number.isInteger(id) && id > 0 ? getEntry(id) : null;
  if (!entry) notFound();

  return (
    <div>
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.5px]">기록 수정</h1>
      <EntryForm id={entry.id} initial={entry} tagSuggestions={listTags().map((t) => t.name)} />
    </div>
  );
}
