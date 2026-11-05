"use client";

import { useEffect, useState } from "react";

export interface ViewportBox {
  /** Visible height above the on-screen keyboard. */
  height: number;
  /** How far iOS has scrolled the layout viewport to keep the focused field in view. */
  offsetTop: number;
  keyboardOpen: boolean;
}

/**
 * Tracks the visual viewport, which shrinks when the on-screen keyboard opens
 * (iOS Safari doesn't resize the layout viewport or `dvh` for it).
 */
export function useVisualViewport(): ViewportBox | null {
  const [box, setBox] = useState<ViewportBox | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setBox({
        height: Math.round(vv.height),
        offsetTop: Math.round(vv.offsetTop),
        keyboardOpen: window.innerHeight - vv.height > 150,
      });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return box;
}

/** Style that pins a full-screen layer to the visible area. Falls back to inset-0 before mount. */
export function viewportStyle(box: ViewportBox | null): React.CSSProperties | undefined {
  return box ? { top: box.offsetTop, height: box.height, bottom: "auto" } : undefined;
}
