"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage, discardImages, UploadError } from "@/lib/media/upload-client";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Monogram } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

export interface CommitResult {
  ok: boolean;
  error?: string;
}

/**
 * Subida de logo (foto de perfil) o banner.
 *
 * A diferencia de las fotos de producto, aquí el cambio se guarda al momento:
 * se sube a R2 y se llama a `onCommit(key)`, una server action que asocia la
 * clave y borra la imagen anterior. Si la acción falla, la subida se descarta.
 */
export function BrandImageUpload({
  kind,
  label,
  hint,
  currentUrl,
  inherited = false,
  fallbackLetter,
  onCommit,
}: {
  kind: "logo" | "banner";
  label: string;
  hint?: string;
  currentUrl: string | null;
  /** La imagen mostrada se hereda del negocio (no se puede "quitar" aquí). */
  inherited?: boolean;
  fallbackLetter?: string;
  onCommit: (key: string | null) => Promise<CommitResult>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const shown = preview ?? currentUrl;
  const hasOwn = Boolean(currentUrl) && !inherited;

  async function onFile(file: File) {
    setBusy("upload");
    const local = URL.createObjectURL(file);
    setPreview(local);
    let key: string | null = null;
    try {
      const up = await uploadImage(file, kind);
      key = up.key;
      const res = await onCommit(up.key);
      if (!res.ok) throw new UploadError(res.error ?? "No se pudo guardar la imagen.");
      toast(`${label} actualizado.`, { tone: "success" });
      router.refresh();
    } catch (err) {
      if (key) discardImages([key]);
      toast(err instanceof UploadError ? err.message : "No se pudo subir la imagen.", {
        tone: "error",
      });
    } finally {
      setPreview(null);
      URL.revokeObjectURL(local);
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("remove");
    try {
      const res = await onCommit(null);
      if (!res.ok) throw new Error(res.error);
      toast(`${label} eliminado.`, { tone: "success" });
      router.refresh();
    } catch (err) {
      toast(err instanceof Error && err.message ? err.message : "No se pudo quitar la imagen.", {
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  const isLogo = kind === "logo";

  return (
    <div>
      <p className="t-label mb-2 text-muted-foreground">{label}</p>
      <div className={cn("flex gap-3", isLogo ? "items-center" : "flex-col")}>
        <div
          className={cn(
            "relative shrink-0 overflow-hidden border border-border bg-muted",
            isLogo ? "size-20 rounded-[var(--radius-theme-sm)]" : "aspect-[3/1] w-full",
          )}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className={cn("size-full object-cover", busy === "upload" && "opacity-50")}
            />
          ) : isLogo && fallbackLetter ? (
            <Monogram letter={fallbackLetter} className="size-full text-2xl" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-6" aria-hidden="true" />
            </span>
          )}
          {busy === "upload" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Subiendo…</span>
            </span>
          )}
          {inherited && shown && !preview && (
            <span className="t-label absolute bottom-0 left-0 bg-background/90 px-1.5 py-0.5 text-[0.5625rem] text-muted-foreground">
              Del negocio
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            {hasOwn ? "Cambiar" : "Subir"}
          </Button>
          {hasOwn && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={remove}
              className="gap-1.5"
            >
              {busy === "remove" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              Quitar
            </Button>
          )}
        </div>
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
    </div>
  );
}
