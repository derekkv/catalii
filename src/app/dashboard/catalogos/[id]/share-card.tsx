"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, MessageCircle, Download, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export function ShareCard({
  url,
  isPublic,
  name,
}: {
  url: string;
  isPublic: boolean;
  name: string;
}) {
  const [qr, setQr] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isPublic) return;
    let active = true;
    // Margen 2 y nivel M: suficiente para que lo lea un teléfono de mostrador
    // incluso impreso en pequeño.
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then((data) => {
        if (active) setQr(data);
      })
      .catch(() => {
        if (active) setQrFailed(true);
      });
    return () => {
      active = false;
    };
  }, [url, isPublic]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Enlace copiado.", { tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No se pudo copiar. Selecciona el enlace y cópialo a mano.", { tone: "error" });
    }
  }

  const waShare = `https://wa.me/?text=${encodeURIComponent(
    `Mira nuestro catálogo "${name}": ${url}`,
  )}`;

  if (!isPublic) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-theme-sm)] bg-muted p-4">
        <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold">Este catálogo es un borrador</p>
          <p className="text-muted-foreground">
            Márcalo como publicado abajo para obtener su enlace y su código QR.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="shrink-0">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt={`Código QR del catálogo ${name}`}
            className="size-40 rounded-[var(--radius-theme-sm)] border border-border bg-white p-1"
          />
        ) : qrFailed ? (
          <div className="flex size-40 items-center justify-center rounded-[var(--radius-theme-sm)] border border-border p-3 text-center text-xs text-muted-foreground">
            No se pudo generar el QR. El enlace sí funciona.
          </div>
        ) : (
          <Skeleton className="size-40" />
        )}
      </div>

      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-muted px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm" title={url}>
            {url}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copiar enlace del catálogo"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] transition-colors hover:bg-card"
          >
            {copied ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={waShare} target="_blank" rel="noopener noreferrer">
            <Button variant="accent" className="gap-2">
              <MessageCircle className="size-4" aria-hidden="true" /> Compartir por WhatsApp
            </Button>
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="size-4" aria-hidden="true" /> Ver como cliente
            </Button>
          </a>
          {qr && (
            <a href={qr} download={`catalii-qr-${name.toLowerCase().replace(/\s+/g, "-")}.png`}>
              <Button variant="outline" className="gap-2">
                <Download className="size-4" aria-hidden="true" /> Descargar QR
              </Button>
            </a>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Imprime el QR y pégalo en tu mostrador o en las cajas de reparto: el cliente pide
          sin instalar nada.
        </p>
      </div>
    </div>
  );
}
