"use client";

import { useEffect, useRef, type DependencyList } from "react";

/**
 * Keeps a scrollable container pinned to its newest content.
 *
 * Returns the ref to attach to the scrolling element; the scroll fires whenever
 * `dependencies` change (new message, loading state flip, …).
 */
export function useAutoScroll<T extends HTMLElement>(dependencies: DependencyList) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    // The caller decides what counts as "new content".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return ref;
}
