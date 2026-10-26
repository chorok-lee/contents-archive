export function SetupNotice() {
  return (
    <div className="rounded-lg bg-tint-yellow px-5 py-4 text-[15px] leading-relaxed text-charcoal">
      <p className="font-semibold">데이터베이스가 아직 연결되지 않았어요</p>
      <p className="mt-1">
        <code className="rounded-xs bg-canvas px-1">.env.local</code>에{" "}
        <code className="rounded-xs bg-canvas px-1">SUPABASE_URL</code>과{" "}
        <code className="rounded-xs bg-canvas px-1">SUPABASE_SECRET_KEY</code>를 넣고 서버를 다시
        시작해 주세요. 방법은 <code className="rounded-xs bg-canvas px-1">docs/SUPABASE.md</code>에
        있어요.
      </p>
    </div>
  );
}
