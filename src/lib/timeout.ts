/**
 * Acota una promesa en el tiempo.
 *
 * Nace de un problema concreto: `auth-js` reintenta el refresco de token con
 * espera creciente y, si el servidor de Auth no responde, la llamada tarda
 * ~30 s. Lo que consume el tiempo son las ESPERAS entre reintentos, no la red,
 * así que un `AbortSignal` en el `fetch` no lo evita: hay que acotar la
 * operación entera.
 *
 * Importante en Cloudflare Workers, donde un request colgado agota los
 * límites de CPU y duración.
 */

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`"${label}" no respondió en ${ms} ms.`);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}
