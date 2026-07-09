"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseCarouselStateReturn<T extends HTMLElement> {
  ref: React.RefObject<T>;
  isAtStart: boolean;
  isAtEnd: boolean;
  scrollProgress: number;
  isDragging: boolean;
  scroll: (direction: "left" | "right") => void;
  handlePointerDown: (e: React.PointerEvent<T>) => void;
  handlePointerMove: (e: React.PointerEvent<T>) => void;
  handlePointerUpOrLeave: (e: React.PointerEvent<T>) => void;
}

/**
 * Encapsulates the horizontal-scroll carousel pattern: drag-to-pan for mouse,
 * native touch scrolling for mobile, arrow-button scrolling, edge detection,
 * and progress tracking.
 *
 * Strategy: hybrid. On touch devices (pointerType === "touch") we let the
 * browser handle scroll natively with hardware inertia via overflow-x-auto +
 * snap-x. On mouse we use PointerEvent capture to implement drag-to-pan.
 *
 * Returns a ref to attach to the scroll container plus all state
 * and event handlers a consumer needs.
 */
export function useCarouselState<T extends HTMLElement = HTMLDivElement>(): UseCarouselStateReturn<T> {
  const ref = useRef<T>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef(0);
  const dragScrollLeft = useRef(0);
  const startX = useRef(0);
  const isDraggingState = useRef(false);

  const updateState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    setIsAtStart(scrollLeft <= 4);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 4);

    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateState();
    const timer = setTimeout(updateState, 100);

    el.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    // Click prevention: when a drag exceeds the 6px threshold,
    // suppress the subsequent click on capture phase so card links
    // don't fire after a drag gesture.
    const handlePreventClick = (e: MouseEvent) => {
      if (isDraggingState.current) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingState.current = false;
      }
    };

    el.addEventListener("click", handlePreventClick, true);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
      el.removeEventListener("click", handlePreventClick, true);
    };
  }, [updateState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: "smooth",
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<T>) => {
    // Delegate touch gestures to native browser scroll (hardware inertia).
    if (e.pointerType === "touch") return;

    const el = ref.current;
    if (!el) return;

    setIsDragging(true);
    isDraggingState.current = false;
    startX.current = e.pageX;
    dragStart.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;

    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<T>) => {
    if (!isDragging) return;
    const el = ref.current;
    if (!el) return;

    const distance = Math.abs(e.pageX - startX.current);
    if (distance > 6) {
      isDraggingState.current = true;
    }

    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStart.current) * 1.5;
    el.scrollLeft = dragScrollLeft.current - walk;
  }, [isDragging]);

  const handlePointerUpOrLeave = useCallback((e: React.PointerEvent<T>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  }, [isDragging]);

  return {
    ref,
    isAtStart,
    isAtEnd,
    scrollProgress,
    isDragging,
    scroll,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrLeave,
  };
}
