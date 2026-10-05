"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Revelado al entrar en pantalla.
 *
 * Dos decisiones importantes:
 *  · La clase `reveal` (que parte de opacity 0) se añade DESPUÉS del montaje.
 *    Así el HTML del servidor sale visible y la página sigue siendo legible si
 *    el JS no carga. Animar desde opacidad cero en el HTML inicial es cómo se
 *    acaba con páginas en blanco.
 *  · Si el usuario pide movimiento reducido, no se arma nada.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = ref.current;
    if (!node) return;

    setArmed(true);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(armed && "reveal", visible && "is-visible", className)}
    >
      {children}
    </div>
  );
}
