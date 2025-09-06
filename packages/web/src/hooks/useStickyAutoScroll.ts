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
    // Use double requestAnimationFrame to ensure DOM is fully committed
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }, [stick, containerRef]);

  const markMessageAnchor = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    lastAnchorRef.current = node;
    if (stick) {
      // Smooth reveal without jarring jumps
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.scrollIntoView({ 
            block: "nearest", 
            behavior: "smooth",
            inline: "nearest"
          });
        });
      });
    }
  }, [stick]);

  // Prevent focus-induced scroll jumps
  const preventScrollJumps = useCallback((e: FocusEvent) => {
    // If we're auto-scrolling, prevent focus from interfering
    if (stick) {
      e.preventDefault();
    }
  }, [stick]);

  return { stick, scrollToBottomIfStuck, markMessageAnchor, preventScrollJumps };
}