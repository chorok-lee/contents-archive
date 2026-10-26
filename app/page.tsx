import { Composer } from "@/components/Composer";

export default function HomePage() {
  return (
    <div className="pt-4 sm:pt-12">
      <h1 className="mb-2 text-[28px] leading-tight font-semibold tracking-[-0.5px] sm:text-[36px]">
        오늘은 무엇을 읽었나요?
      </h1>
      <p className="mb-8 text-[17px] text-slate">
        URL을 붙여넣으면 바로 요약해 드려요. 느낀 점만 적으면 돼요.
      </p>
      <Composer />
    </div>
  );
}
