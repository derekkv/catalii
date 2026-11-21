"use client";

import { useActionState } from "react";
import { Loader2, Send, Check } from "lucide-react";
import { sendContactMessage, type ContactState } from "./actions";
import { CONTACT_SUBJECTS, SUBJECT_LABELS, LIMITS } from "./contact-schema";
import { Button } from "@/components/ui/button";
import {
  Input,
  Textarea,
  Select,
  Label,
  FieldHint,
  FieldError,
} from "@/components/ui/input";

const initial: ContactState = { ok: false };

/**
 * Formulario de contacto de la página pública.
 *
 * El mensaje se guarda en la base (tabla `contact_message`); no se envía
 * ningún correo porque el proyecto no tiene proveedor de SMTP propio, así que
 * el acuse que se muestra solo promete que el mensaje quedó registrado.
 */
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);

  if (state.ok) {
    return (
      <div role="status" className="rule-t mt-10 pt-6">
        <p className="t-label flex items-center gap-2 text-foreground">
          <Check className="size-4 text-primary" aria-hidden="true" />
          Mensaje recibido
        </p>
        <p className="t-body mt-2 text-muted-foreground">
          Queda registrado con tu correo para poder responderte. Si es urgente, escribe
          directamente al correo de arriba.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="form-contacto" className="rule-t mt-10 pt-6">
      <h2 id="form-contacto" className="t-h3">
        2. Escríbenos desde aquí
      </h2>
      <p className="t-body mt-2 text-muted-foreground">
        Rellena el formulario y el mensaje nos llega sin que tengas que abrir tu correo.
      </p>

      <form action={action} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-name">Tu nombre</Label>
            <Input
              id="c-name"
              name="name"
              required
              maxLength={LIMITS.name}
              autoComplete="name"
              placeholder="María Chalán"
            />
          </div>
          <div>
            <Label htmlFor="c-email">Tu correo</Label>
            <Input
              id="c-email"
              name="email"
              type="email"
              required
              maxLength={LIMITS.email}
              autoComplete="email"
              placeholder="maria@sudistribuidora.ec"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="c-subject">Asunto</Label>
          <Select id="c-subject" name="subject" required defaultValue="duda">
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="c-message">Mensaje</Label>
          <Textarea
            id="c-message"
            name="message"
            required
            rows={5}
            minLength={10}
            maxLength={LIMITS.message}
            placeholder="Cuéntanos qué necesitas."
          />
          <FieldHint>
            Hasta {LIMITS.message} caracteres. No escribas contraseñas ni datos de tarjeta.
          </FieldHint>
        </div>

        {/* Señuelo para bots: fuera de la vista, sin tabulación y sin voz para
            lectores de pantalla. Una persona nunca lo rellena. */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="c-website">No rellenar</label>
          <input
            id="c-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            Enviar mensaje
          </Button>
        </div>

        {/* aria-live: quien use lector de pantalla se entera del error sin
            tener que volver a recorrer el formulario. */}
        <div aria-live="polite">{state.error && <FieldError>{state.error}</FieldError>}</div>
      </form>
    </section>
  );
}
