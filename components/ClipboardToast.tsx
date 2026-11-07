"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Close, LinkIcon } from "./icons";

const SEEN_KEY = "readlog:last-offered-link";
const AUTO_HIDE_MS = 6000;

export function looksLikeUrl(text: string): boolean {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?([/?#]\S*)?$/i.test(text.trim());
}

function remember(url: string) {
  try {
    localStorage.setItem(SEEN_KEY, url);
  } catch {}
}

function alreadyOffered(url: string): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === url;
  } catch {
    return false;
  }
}

/** "granted" when the browser lets us read the clipboard without a tap (Chromium after a first allow). */
async function clipboardPermission(): Promise<PermissionState | "unsupported"> {
  try {
    const status = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
    return status.state;
  } catch {
    return "unsupported"; // Safari and Firefox don't expose this permission
  }
}

interface Props {
  /** Don't offer while the sheet or editor is open. */
  suppressed: boolean;
  /** Called from the tap with the clipboard link, or null when it held no link. */
  onAccept: (url: string | null) => void;
}

/**
 * When the app opens or comes back to the foreground, offers to make a bookmark from the
 * copied link. Where the clipboard can be read silently it only appears for a new link;
 * elsewhere (iPhone Safari) it can't know, so it asks and reads the clipboard on tap.
 */
export function ClipboardToast({ suppressed, onAccept }: Props) {
  const [visible, setVisible] = useState(false);
  const [host, setHost] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const suppressedRef = useRef(suppressed);
  suppressedRef.current = suppressed;

  const show = useCallback((linkHost: string | null) => {
    setHost(linkHost);
    setVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  }, []);

  const check = useCallback(async () => {
    if (suppressedRef.current) return;
    const permission = await clipboardPermission();
    if (permission === "denied") return;
    if (permission !== "granted") return show(null);
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!looksLikeUrl(text) || alreadyOffered(text)) return;
      remember(text);
      show(new URL(/^https?:/i.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, ""));
    } catch {
      show(null);
    }
  }, [show]);

  useEffect(() => {
    check();
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(hideTimer.current);
    };
  }, [check]);

  useEffect(() => {
    if (suppressed) setVisible(false);
  }, [suppressed]);

  async function accept() {
    setVisible(false);
    // Read inside the tap: iOS Safari asks the user to confirm the paste here.
    let text = "";
    try {
      text = (await navigator.clipboard.readText()).trim();
    } catch {}
    if (looksLikeUrl(text)) {
      remember(text);
      onAccept(text);
    } else {
      onAccept(null);
    }
  }

  if (!visible) return null;
  return (
    <div
      role="status"
      className="animate-sheet-up fixed inset-x-0 bottom-[calc(max(16px,env(safe-area-inset-bottom))+150px)] z-20 mx-auto flex w-[calc(100%-32px)] max-w-md items-center gap-1 rounded-full bg-canvas/85 p-1.5 shadow-float backdrop-blur-xl"
    >
      <button type="button" onClick={accept} className="flex min-w-0 flex-1 items-center gap-3 rounded-full py-1.5 pr-2 pl-1.5 text-left active:scale-[0.98]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
          <LinkIcon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">
            {host ? `${host} 링크로 북마크를 만들까요?` : "복사한 링크로 북마크를 만들까요?"}
          </span>
          <span className="block truncate text-[13px] text-steel">누르면 바로 3줄 요약으로</span>
        </span>
        <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[14px] font-semibold text-white">만들기</span>
      </button>
      <button type="button" onClick={() => setVisible(false)} aria-label="닫기" className="flex size-9 shrink-0 items-center justify-center rounded-full text-steel">
        <Close size={16} />
      </button>
    </div>
  );
}
