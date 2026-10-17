"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { canAnimate, whenIdle } from "@/lib/motion/conditions";

/**
 * Charge GSAP une fois la page au repos, puis joue les moments de chaque page et les
 * défait au changement de page. Avec « réduire les animations », ne charge rien.
 */
export function MotionLoader({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canAnimate({ reducedMotion })) return;
    let cancelled = false;
    let undo: (() => void) | undefined;
    const cancelIdle = whenIdle(() => {
      void import("./moments").then(({ playMoments }) => {
        if (!cancelled) undo = playMoments(document, { locale });
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      undo?.();
    };
  }, [pathname, locale]);

  return null;
}
