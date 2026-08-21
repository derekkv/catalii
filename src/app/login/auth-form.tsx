"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { signInAction, signUpAction, forgotPasswordAction, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initial: AuthState = { ok: false };
type Mode = "signin" | "signup" | "forgot";

export function AuthForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const initialMode: Mode = params.get("tab") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div>
      {mode !== "forgot" && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <TabButton active={mode === "signin"} onClick={() => setMode("signin")}>
            Iniciar sesión
          </TabButton>
          <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
            Crear cuenta
          </TabButton>
        </div>
      )}

      {mode === "signin" && <SignIn next={next} onForgot={() => setMode("forgot")} />}
      {mode === "signup" && <SignUp next={next} />}
      {mode === "forgot" && <Forgot onBack={() => setMode("signin")} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-10 cursor-pointer rounded-full text-sm font-bold transition-colors",
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground hover:bg-muted"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function Alert({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-semibold text-destructive">
        {state.error}
      </p>
    );
  if (state.ok && state.info)
    return (
      <p className="flex items-start gap-2 rounded-[var(--radius-theme-sm)] bg-muted p-3 text-sm font-medium text-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        {state.info}
      </p>
    );
  return null;
}

function SignIn({ next, onForgot }: { next: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="si-email">Correo</Label>
        <Input id="si-email" name="email" type="email" autoComplete="email" required placeholder="tu@negocio.com" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="si-pass" className="mb-0">Contraseña</Label>
          <button type="button" onClick={onForgot} className="cursor-pointer text-xs font-semibold text-primary hover:underline">
            ¿La olvidaste?
          </button>
        </div>
        <PasswordInput id="si-pass" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>
      <Alert state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Entrar
      </Button>
    </form>
  );
}

function SignUp({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpAction, initial);

  if (state.ok && state.info) return <Alert state={state} />;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="su-name">Tu nombre</Label>
        <Input id="su-name" name="name" autoComplete="name" maxLength={120} placeholder="Nombre y apellido" />
      </div>
      <div>
        <Label htmlFor="su-email">Correo</Label>
        <Input id="su-email" name="email" type="email" autoComplete="email" required placeholder="tu@negocio.com" />
      </div>
      <div>
        <Label htmlFor="su-pass">Contraseña</Label>
        <PasswordInput id="su-pass" name="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo 8 caracteres" />
      </div>
      <div>
        <Label htmlFor="su-confirm">Repite la contraseña</Label>
        <PasswordInput id="su-confirm" name="confirm" autoComplete="new-password" required minLength={8} placeholder="••••••••" />
      </div>
      <Alert state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Crear mi cuenta
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Al crear tu cuenta aceptas los términos del servicio.
      </p>
    </form>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Volver
      </button>
      <div>
        <h2 className="font-heading text-lg font-bold">Restablecer contraseña</h2>
        <p className="text-sm text-muted-foreground">Te enviaremos un enlace a tu correo.</p>
      </div>
      <div>
        <Label htmlFor="fp-email">Correo</Label>
        <Input id="fp-email" name="email" type="email" autoComplete="email" required placeholder="tu@negocio.com" />
      </div>
      <Alert state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Enviar enlace
      </Button>
    </form>
  );
}
