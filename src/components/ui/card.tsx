import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Ficha.
 *
 * Papel blanco sobre papel crema, separado por una regla de pelo en vez de una
 * sombra difusa. El contraste de superficie ya la despega del fondo; añadir
 * elevación a cada ficha es lo que convierte una pantalla en un montón de
 * cajas flotantes sin jerarquía.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-theme)] border border-border bg-card text-card-foreground",
        interactive &&
          "transition-colors duration-150 hover:border-input focus-within:border-input",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("t-h3", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("t-small text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2 rule-t p-5 py-4", className)} {...props} />
  );
}
