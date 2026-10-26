import { Composer } from "@/components/Composer";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="pt-2 sm:pt-10">
      <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.5px] sm:text-[40px]">
        읽은 글 기록하기
      </h1>
      <p className="mt-3 mb-8 text-[17px] leading-relaxed text-steel">
        오늘 읽은 글의 URL을 붙여넣으세요.
        <br />
        바로 3줄로 요약해 드려요. 느낀 점만 남기면 끝.
      </p>
      {isSupabaseConfigured() ? <Composer /> : <SetupNotice />}
    </div>
  );
}
