"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareCard({ url, isPublic }: { url: string; isPublic: boolean }) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then((data) => {
        if (active) setQr(data);
      })
      .catch(() => setQr(""));
    return () => {
      active = false;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const waShare = `https://wa.me/?text=${encodeURIComponent(`Mira nuestro catálogo: ${url}`)}`;

  if (!isPublic) {
    return (
      <p className="text-sm text-muted-foreground">
        Publica el catálogo para obtener su enlace y código QR para compartir.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt="Código QR del catálogo"
          className="size-40 rounded-[var(--radius-theme-sm)] border border-border bg-white p-1"
        />
      )}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-muted px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{url}</span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copiar enlace"
            className="flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] hover:bg-card"
          >
            {copied ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={waShare} target="_blank" rel="noopener noreferrer">
            <Button variant="accent" className="gap-2">
              <MessageCircle className="size-4" aria-hidden="true" /> Compartir por WhatsApp
            </Button>
          </a>
          {qr && (
            <a href={qr} download="catalogo-qr.png">
              <Button variant="outline" className="gap-2">
                <Download className="size-4" aria-hidden="true" /> Descargar QR
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
