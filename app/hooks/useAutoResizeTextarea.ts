"use client";

import { useEffect, useRef } from "react";

/**
 * Grows a textarea with its content up to `maxHeight`, then lets it scroll.
 *
 * Driven by `value` rather than by the change handler, so the box also shrinks
 * back when the value is reset externally — e.g. after a message is sent.
 */
export function useAutoResizeTextarea(value: string, maxHeight = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    // Reset first so scrollHeight reflects the content, not the previous height.
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}
