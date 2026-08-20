"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSiteUrl } from "@/lib/site";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const clean = email.trim().toLowerCase();
    // Validación básica de formato en cliente (el servidor revalida).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus("error");
      setMessage("Ingresa un correo válido.");
      return;
    }

    try {
      const supabase = createClient();
      const redirectTo = `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage("No se pudo enviar el enlace. Intenta de nuevo.");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-primary" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold">Revisa tu correo</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos un enlace de acceso a <strong>{email}</strong>. Ábrelo desde este
          dispositivo para entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@negocio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status === "error"}
          required
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {message}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Enviando…
          </>
        ) : (
          <>
            <Mail className="size-4" aria-hidden="true" /> Enviar enlace de acceso
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Sin contraseñas. Te enviamos un enlace mágico a tu correo.
      </p>
    </form>
  );
}
