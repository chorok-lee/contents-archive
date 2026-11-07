"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "홈",
    match: (p: string) => p === "/",
    icon: <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />,
  },
  {
    href: "/list",
    label: "목록",
    match: (p: string) => p.startsWith("/list"),
    icon: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  },
];

/** Floating glass tab bar (홈 / 목록). Hidden on the note editor page, which covers the screen. */
export function TabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/notes/")) return null;

  return (
    <nav
      aria-label="탭"
      className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-canvas/80 p-1.5 shadow-float backdrop-blur-xl"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-24 flex-col items-center gap-0.5 rounded-full px-5 py-1.5 text-[11px] font-semibold transition-colors active:scale-95 ${
              active ? "bg-tint text-primary" : "text-steel"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
