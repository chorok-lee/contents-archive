import type { Metadata } from "next";
import Link from "next/link";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Readlog", template: "%s · Readlog" },
  description: "읽은 글과 느낀 점을 쌓아 두는 개인 아카이브",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
          <nav className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-4">
            <Link href="/" className="mr-auto text-[17px] font-semibold tracking-tight">
              📚 Readlog
            </Link>
            <Link href="/archive" className="btn btn-ghost text-sm">
              아카이브
            </Link>
            <Link href="/entries/new" className="btn btn-primary">
              기록하기
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 pt-8 pb-24">{children}</main>
      </body>
    </html>
  );
}
