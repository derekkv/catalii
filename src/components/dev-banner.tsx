"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function DevBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Small delay so the animation is visible on mount
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4",
        "bg-foreground/30 backdrop-blur-sm",
        "transition-opacity duration-300",
        closing ? "opacity-0" : "opacity-100"
      )}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-banner-title"
    >
      <div
        className={cn(
          "relative max-w-sm w-full bg-card rounded-[var(--radius-theme-lg)] p-6 pt-10 text-center",
          "shadow-sticker border-2 border-border",
          "transition-all duration-300",
          closing
            ? "scale-90 opacity-0"
            : "scale-100 opacity-100 animate-fade-up"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kawaii face / construction emoji */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <span
            className="inline-block text-5xl animate-float select-none"
            aria-hidden="true"
          >
            🚧
          </span>
        </div>

        {/* Sparkles decoration */}
        <div className="absolute top-2 right-3 text-lg animate-float-slow select-none" aria-hidden="true">
          ✨
        </div>
        <div className="absolute top-3 left-4 text-sm animate-float select-none" aria-hidden="true">
          💖
        </div>

        <h2
          id="dev-banner-title"
          className="font-heading text-xl font-bold text-foreground mt-2 mb-2"
        >
          Estamos construyendo algo bonito~
        </h2>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Catalii todavía está en desarrollo.
          <br />
          Puede que encuentres cositas sin terminar, ¡pero estamos dándole con todo! 💪✨
        </p>

        {/* Progress bar kawaii */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-5 border border-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--fun-pink)] via-[var(--fun-purple)] to-[var(--fun-cyan)] animate-pulse"
            style={{ width: "65%" }}
          />
        </div>

        <button
          onClick={handleClose}
          className={cn(
            "inline-flex items-center gap-2 font-semibold",
            "h-11 px-6 text-sm rounded-[var(--radius-theme-sm)]",
            "bg-primary text-on-primary hover:opacity-90 shadow-soft",
            "cursor-pointer transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "animate-wiggle-hover"
          )}
        >
          ¡Entendido! 🎉
        </button>

        <p className="text-xs text-muted-foreground mt-3 opacity-70">
          Gracias por tu paciencia 💕
        </p>
      </div>
    </div>
  );
}
