import { useCallback, useEffect, useRef, useState } from "react";

export function useStickyAutoScroll(containerRef: React.RefObject<HTMLElement>) {
  const [stick, setStick] = useState(true);
  const lastAnchorRef = useRef<HTMLElement | null>(null);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 100; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, [containerRef]);

  const onScroll = useCallback(() => {
    setStick(isNearBottom());
  }, [isNearBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, containerRef]);

  const scrollToBottomIfStuck = useCallback(() => {
    if (!stick) return;
    const el = containerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [stick, containerRef]);

  const markMessageAnchor = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    lastAnchorRef.current = node;
    if (stick) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ block: "end", behavior: "smooth" });
      });
    }
  }, [stick]);

  return { stick, scrollToBottomIfStuck, markMessageAnchor };
}