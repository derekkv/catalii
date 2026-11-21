/**
 * Enlaces de WhatsApp.
 *
 * El número se guarda como lo escribió el mayorista ("+52 55 1234 5678"),
 * pero `wa.me` solo acepta dígitos. La normalización estaba repetida en cada
 * sitio que pintaba un botón de WhatsApp; aquí queda en un lugar.
 */

/** Solo los dígitos del número, o cadena vacía si no hay ninguno. */
export function whatsappDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

/** `https://wa.me/<dígitos>[?text=…]`, o `null` si el número no sirve. */
export function whatsappHref(phone: string | null | undefined, message?: string): string | null {
  const digits = whatsappDigits(phone);
  if (digits.length < 7) return null; // ni el número más corto del mundo baja de ahí
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}
