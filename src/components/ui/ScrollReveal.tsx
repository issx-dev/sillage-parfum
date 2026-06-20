"use client";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function ScrollReveal({ children, className, stagger = 0 }: ScrollRevealProps) {
  const reducedMotion = useReducedMotion();
  const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
      style={stagger ? { transitionDelay: `${stagger}ms` } : undefined}
    >
      {children}
    </div>
  );
}
