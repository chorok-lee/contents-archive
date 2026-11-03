import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-3xl">🔎</p>
      <h1 className="mt-3 text-[22px] font-semibold">기록을 찾을 수 없어요</h1>
      <Link href="/" className="btn btn-secondary mt-6">
        홈으로
      </Link>
    </div>
  );
}
