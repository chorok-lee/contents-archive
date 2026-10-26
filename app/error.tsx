"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-3xl">⚠️</p>
      <h1 className="mt-3 text-[22px] font-semibold">기록을 불러오지 못했어요</h1>
      <p className="mt-2 text-sm text-steel">데이터베이스 연결을 확인한 뒤 다시 시도해 주세요.</p>
      <button type="button" onClick={reset} className="btn btn-secondary mt-6">
        다시 시도
      </button>
    </div>
  );
}
