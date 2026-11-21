/**
 * Caché en memoria con caducidad por entrada.
 *
 * Es deliberadamente mínima: un `Map` con marca de tiempo y un tope de
 * entradas. Sirve para lo que no vale la pena consultar otra vez en segundos
 * (el mapeo slug → ids de las métricas). Al vivir en el proceso, cada instancia
 * tiene su propia copia: el precio es que un cambio en Supabase tarda hasta un
 * TTL en verse, y eso aquí es aceptable.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();

  constructor(private readonly maxEntries = 500) {}

  get(key: string): V | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    // Un `Map` conserva el orden de inserción, así que la primera clave es la
    // más antigua: basta con descartarla para no crecer sin límite.
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Solo para pruebas o para forzar una relectura. */
  clear(): void {
    this.entries.clear();
  }
}
