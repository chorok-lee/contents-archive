export function SetupNotice() {
  return (
    <div className="card px-5 py-5 text-[15px] leading-relaxed text-slate">
      <p className="text-[17px] font-semibold text-ink">데이터베이스가 아직 연결되지 않았어요</p>
      <p className="mt-2">
        <code className="rounded-xs bg-fill px-1">.env.local</code>에{" "}
        <code className="rounded-xs bg-fill px-1">SUPABASE_URL</code>과{" "}
        <code className="rounded-xs bg-fill px-1">SUPABASE_SECRET_KEY</code>를 넣고 서버를 다시 시작해
        주세요. 방법은 <code className="rounded-xs bg-fill px-1">docs/SUPABASE.md</code>에 있어요.
      </p>
    </div>
  );
}
