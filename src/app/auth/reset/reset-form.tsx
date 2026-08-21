"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ResetForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password.length < 8) {
      setStatus("error");
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStatus("saving");
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("done");
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch {
      setStatus("error");
      setError("No se pudo actualizar la contraseña. El enlace pudo expirar.");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-primary" aria-hidden="true" />
        <p className="font-semibold">Contraseña actualizada. Entrando…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="rp-pass">Nueva contraseña</Label>
        <div className="relative">
          <Input id="rp-pass" name="password" type={show ? "text" : "password"} required minLength={8} className="pr-11" placeholder="Mínimo 8 caracteres" />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground hover:bg-muted"
          >
            {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="rp-confirm">Repite la contraseña</Label>
        <Input id="rp-confirm" name="confirm" type={show ? "text" : "password"} required minLength={8} placeholder="••••••••" />
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={status === "saving"}>
        {status === "saving" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Guardar contraseña
      </Button>
    </form>
  );
}
