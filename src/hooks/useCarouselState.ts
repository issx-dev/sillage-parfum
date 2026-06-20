"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseCarouselStateReturn<T extends HTMLElement> {
  ref: React.RefObject<T>;
  isAtStart: boolean;
  isAtEnd: boolean;
  scrollProgress: number;
  isDragging: boolean;
  scroll: (direction: "left" | "right") => void;
  handleMouseDown: (e: React.MouseEvent<T>) => void;
  handleMouseMove: (e: React.MouseEvent<T>) => void;
  handleMouseUpOrLeave: () => void;
}

/**
 * Encapsulates the horizontal-scroll carousel pattern: drag-to-pan,
 * arrow-button scrolling, edge detection, and progress tracking.
 *
 * Returns a ref to attach to the scroll container plus all state
 * and event handlers a consumer needs. Pixel-perfect equivalent of
 * the inline logic previously duplicated across FeaturedProducts and
 * SecondaryProducts.
 */
export function useCarouselState<T extends HTMLElement = HTMLDivElement>(): UseCarouselStateReturn<T> {
  const ref = useRef<T>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef(0);
  const dragScrollLeft = useRef(0);
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = window.matchMedia("(pointer: coarse)").matches;
  }, []);

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

    el.addEventListener("scroll", updateState);
    window.addEventListener("resize", updateState);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
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

  const handleMouseDown = useCallback((e: React.MouseEvent<T>) => {
    if (isTouch.current) return;
    const el = ref.current;
    if (!el) return;
    setIsDragging(true);
    dragStart.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!isDragging) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStart.current) * 1.5;
    el.scrollLeft = dragScrollLeft.current - walk;
  }, [isDragging]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    ref,
    isAtStart,
    isAtEnd,
    scrollProgress,
    isDragging,
    scroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  };
}
