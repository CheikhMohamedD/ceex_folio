"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { canRunHeroScene, DESKTOP_WIDTH, readEnvironment, whenIdle } from "@/lib/motion/conditions";
import type { SheetSpec } from "./scene";

/**
 * Point d'ancrage de la scène 3D dans le collage du hero. Rien ne se charge sous
 * 1 024 px (pas même un test WebGL), ni sans les autres conditions de la doc ; la scène
 * arrive une fois la page au repos, en fondu, et le collage statique reste l'état de base.
 */
export function HeroScene({ sheets }: { sheets: SheetSpec[] }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  useEffect(() => {
    const container = anchor.current?.parentElement;
    if (!container || window.innerWidth < DESKTOP_WIDTH) return;
    if (!canRunHeroScene(readEnvironment())) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const cancelIdle = whenIdle(() => {
      void import("./scene").then(({ mountHeroScene }) => {
        if (cancelled) return;
        destroy = mountHeroScene(container, sheets, { open: (href) => router.push(href) }).destroy;
      });
    }, 3000);
    return () => {
      cancelled = true;
      cancelIdle();
      destroy?.();
    };
  }, [sheets, router]);

  return <span ref={anchor} hidden />;
}
