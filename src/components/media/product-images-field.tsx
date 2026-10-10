"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_PRODUCT_IMAGES, thumbUrl } from "@/lib/media/config";
import { uploadImage, discardImages, UploadError } from "@/lib/media/upload-client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { StoredImage } from "@/types/database";

interface Item {
  /** id local estable para React (la clave R2 no existe mientras sube). */
  id: string;
  key?: string;
  w?: number;
  h?: number;
  preview: string;
  uploading: boolean;
  /** Subida en esta sesión del formulario y aún no guardada. */
  isNew: boolean;
}

let localId = 0;
const nextId = () => `img-${++localId}`;

/**
 * Campo de hasta 3 fotos de producto.
 *
 * Cada foto se sube a R2 en cuanto se elige (así el guardado del formulario es
 * instantáneo) y el campo publica en un `<input type="hidden">` el JSON con
 * las claves ya subidas. El servidor valida que pertenezcan al negocio.
 *
 * Si el formulario se cierra sin guardar, las fotos nuevas se descartan para
 * no dejar objetos huérfanos en el bucket (`committedRef` lo indica el padre).
 */
export function ProductImagesField({
  initial,
  committedRef,
  onBusyChange,
  name = "images",
}: {
  initial: StoredImage[];
  committedRef: React.RefObject<boolean>;
  onBusyChange?: (busy: boolean) => void;
  name?: string;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<Item[]>(() =>
    initial.slice(0, MAX_PRODUCT_IMAGES).map((img) => ({
      id: nextId(),
      key: img.key,
      w: img.w,
      h: img.h,
      preview: thumbUrl(img.key),
      uploading: false,
      isNew: false,
    })),
  );

  // Espejo en ref para la limpieza al desmontar (el cierre del efecto no ve
  // el estado más reciente).
  const itemsRef = useRef(items);
  const unmountedRef = useRef(false);
  const pendingUploads = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    unmountedRef.current = false;
    // Se lee `.current` al desmontar a propósito: importa si se guardó al final,
    // no al montar. (No es un ref de DOM, el aviso de exhaustive-deps no aplica.)
    const committed = committedRef;
    return () => {
      unmountedRef.current = true;
      if (committed.current) return;
      const unsaved = itemsRef.current.filter((i) => i.isNew && i.key).map((i) => i.key!);
      discardImages(unsaved);
    };
  }, [committedRef]);

  function setBusy(delta: number) {
    pendingUploads.current += delta;
    onBusyChange?.(pendingUploads.current > 0);
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const free = MAX_PRODUCT_IMAGES - items.length;
    if (files.length === 0) return;
    if (free <= 0) {
      toast(`Máximo ${MAX_PRODUCT_IMAGES} fotos por producto.`, { tone: "info" });
      return;
    }
    if (files.length > free) {
      toast(`Solo se agregarán ${free} de ${files.length} fotos (máximo ${MAX_PRODUCT_IMAGES}).`, {
        tone: "info",
      });
    }

    await Promise.all(
      files.slice(0, free).map(async (file) => {
        const id = nextId();
        const preview = URL.createObjectURL(file);
        setItems((prev) => [...prev, { id, preview, uploading: true, isNew: true }]);
        setBusy(1);
        try {
          const up = await uploadImage(file, "product");
          // El panel se cerró mientras subía y nadie va a guardar esta foto.
          if (unmountedRef.current) {
            if (!committedRef.current) discardImages([up.key]);
            return;
          }
          setItems((prev) =>
            prev.map((it) =>
              it.id === id
                ? { ...it, key: up.key, w: up.w, h: up.h, preview: up.thumbUrl, uploading: false }
                : it,
            ),
          );
        } catch (err) {
          setItems((prev) => prev.filter((it) => it.id !== id));
          toast(err instanceof UploadError ? err.message : "No se pudo subir la foto.", {
            tone: "error",
          });
        } finally {
          URL.revokeObjectURL(preview);
          setBusy(-1);
        }
      }),
    );
  }

  function remove(item: Item) {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    // Las fotos ya guardadas se borran de R2 al guardar el producto (el
    // servidor compara con las anteriores). Las nuevas, ahora mismo.
    if (item.isNew && item.key) discardImages([item.key]);
  }

  function makePrimary(item: Item) {
    setItems((prev) => [item, ...prev.filter((it) => it.id !== item.id)]);
  }

  const ready = items.filter((i) => i.key && !i.uploading);
  const value = JSON.stringify(ready.map((i) => ({ key: i.key, w: i.w, h: i.h })));
  const canAdd = items.length < MAX_PRODUCT_IMAGES;

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <ul className="grid grid-cols-3 gap-2" aria-label="Fotos del producto">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-theme-sm)] border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt={i === 0 ? "Foto principal" : `Foto ${i + 1}`}
              className={cn("size-full object-cover", item.uploading && "opacity-50")}
            />
            {item.uploading ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-foreground" aria-hidden="true" />
                <span className="sr-only">Subiendo foto…</span>
              </span>
            ) : (
              <>
                {i === 0 ? (
                  <span className="t-label absolute left-0 top-0 bg-primary px-1.5 py-0.5 text-[0.5625rem] text-on-primary">
                    Principal
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(item)}
                    aria-label={`Usar la foto ${i + 1} como principal`}
                    title="Usar como principal"
                    className="absolute left-1 top-1 flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] bg-background/90 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Star className="size-3.5" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Quitar la foto ${i + 1}`}
                  title="Quitar"
                  className="absolute right-1 top-1 flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] bg-background/90 text-muted-foreground transition-colors hover:bg-destructive hover:text-on-destructive"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </>
            )}
          </li>
        ))}

        {canAdd && (
          <li className="aspect-square">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[var(--radius-theme-sm)] border border-dashed border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                dragOver && "border-primary bg-muted text-foreground",
              )}
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              <span className="t-label text-[0.625rem]">
                {items.length === 0 ? "Agregar fotos" : "Agregar"}
              </span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
