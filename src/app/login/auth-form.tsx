"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { signInAction, signUpAction, forgotPasswordAction, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";
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
        // Pestañas subrayadas, coherentes con los filtros de pedidos. La
        // píldora redondeada anterior era el único elemento con radio completo
        // en toda la app.
        <div className="mb-7 flex rule-b" role="tablist" aria-label="Acceso">
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
      role="tab"
      onClick={onClick}
      aria-selected={active}
      className={cn(
        "t-label flex-1 cursor-pointer border-b-2 pb-3 transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
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
        className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function Alert({ state }: { state: AuthState }) {
  if (state.error) return <FieldError>{state.error}</FieldError>;
  if (state.ok && state.info)
    return (
      <p className="flex items-start gap-2.5 border-l-2 border-primary bg-muted px-3 py-2.5 text-[0.8125rem]">
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
          <button
            type="button"
            onClick={onForgot}
            className="t-label link-ink cursor-pointer text-primary"
          >
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
      <FieldHint className="text-center">
        Al crear tu cuenta aceptas los términos del servicio.
      </FieldHint>
    </form>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <button
        type="button"
        onClick={onBack}
        className="t-label link-ink inline-flex cursor-pointer items-center gap-2 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Volver
      </button>
      <div>
        <h2 className="t-h2">Restablecer contraseña</h2>
        <p className="t-small mt-1 text-muted-foreground">
          Te enviaremos un enlace a tu correo.
        </p>
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
