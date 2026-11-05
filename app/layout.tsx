import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Readlog", template: "%s · Readlog" },
  description: "읽은 글과 느낀 점을 쌓아 두는 개인 아카이브",
  appleWebApp: { capable: true, title: "Readlog", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f2f2f7",
  viewportFit: "cover",
  interactiveWidget: "resizes-content", // Android Chrome: shrink the page when the keyboard opens
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <main className="mx-auto max-w-2xl px-4 pt-[max(20px,env(safe-area-inset-top))] pb-32">
          {children}
        </main>
      </body>
    </html>
  );
}
