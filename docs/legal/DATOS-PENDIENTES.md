# Datos que faltan para cerrar lo legal

> **No es asesoría legal.** Esta es la lista operativa de lo que falta rellenar. Todo se escribe en **un solo archivo**: `src/lib/legal/config.ts`. Al guardar, se actualizan las 6 páginas del sitio y los Markdown de `docs/legal/textos/` (ejecuta `pnpm legal:export`).

**Estado: 35 campos sin rellenar.** Mientras un documento tenga huecos, su página lo avisa arriba y no se indexa en buscadores. Cuando no queden huecos, el aviso desaparece y la página pasa a ser indexable, sin tocar código.

Cómo saber qué falta en cualquier momento:

```bash
pnpm legal:export      # lista los campos vacíos al final
```

---

## 1. Datos de la empresa (7) — solo tú los sabes

Van en `COMPANY`, dentro de `src/lib/legal/config.ts`. Aparecen en Contacto, Privacidad, Términos y en el pie del sitio.

| Campo | Qué es | Ejemplo de formato |
|---|---|---|
| `legalName` | Razón social completa, tal como está registrada | `Comercializadora Ejemplo S.A. de C.V.` |
| `taxId` | Identificación fiscal | `RFC CEJ123456AB1` |
| `address` | Domicilio fiscal o de contacto | `Calle 1 #23, Col. Centro, 44100 Guadalajara, Jalisco` |
| `country` | País de la empresa | `México` |
| `contactEmail` | Correo general y de soporte | `hola@catalii.com` |
| `privacyEmail` | Correo para ejercer derechos sobre datos | `privacidad@catalii.com` |
| `copyrightEmail` | Correo para reclamos de derechos de autor | `derechos@catalii.com` |

Si todavía no hay sociedad constituida y operas como persona física, dilo: cambia qué hay que poner en `legalName` y `taxId`.

**Importante:** los tres correos deben existir y estar atendidos antes de publicar, porque los textos prometen que ahí se responde. Pueden ser el mismo buzón.

---

## 2. Decisiones operativas (18) — las decides tú (algunas con tu abogado)

Van en `LEGAL_DATA`, en el mismo archivo.

### Plazos de conservación (6)
Cuánto tiempo guardas cada cosa, y qué pasa al vencer. El punto 5 de la guía pide un plazo por tipo de dato.

| Campo | Pregunta a responder |
|---|---|
| `retentionAccount` | ¿Cuánto conservas la cuenta y los datos del negocio? ¿Borras cuentas inactivas, p. ej. a los 24 meses? |
| `retentionOrders` | ¿Cuánto conservas los pedidos y los datos de los compradores (nombre, WhatsApp, correo, notas)? |
| `retentionBilling` | ¿Cuánto conservas datos de suscripción y facturación? (aquí suele mandar la ley fiscal: pregunta al abogado) |
| `retentionTechnical` | ¿Cuánto conservas registros técnicos propios? |
| `retentionBackups` | ¿Cada cuánto se hacen copias de seguridad y cuánto viven? (lo marca tu plan de Supabase) |
| `retentionServerLogs` | ¿Cuánto conservan los registros de conexión Cloudflare y Supabase? (consúltalo en sus paneles) |

> Nota técnica: solo está implementada la purga del registro de webhooks (`purge_processed_webhooks`, 90 días). El borrado automático de pedidos y cuentas **no** está programado, porque depende de estos plazos. Cuando los definas, se puede implementar.

### Atención y avisos (4)

| Campo | Pregunta |
|---|---|
| `rightsResponseTime` | ¿En cuánto respondes a quien pide acceso o borrado de sus datos? |
| `supportResponseTime` | ¿Tiempo de respuesta del correo de contacto? |
| `privacyChangeNotice` | ¿Cómo avisarás de cambios en la política? (correo, aviso en el panel…) |
| `termsChangeNotice` | ¿Cómo avisarás de cambios importantes en los términos? |

### Cobros y reembolsos (7)

| Campo | Pregunta |
|---|---|
| `taxesIncluded` | ¿Los precios ($19, $49, $99 USD) llevan impuestos incluidos o se añaden en el pago? **Compruébalo con una compra de prueba en Paddle sandbox.** |
| `cancelConsequences` | Al cancelar o dejar de pagar, ¿qué pasa con los catálogos publicados y los datos? ¿Se despublican, se bajan al plan gratis, se borran? |
| `refundEligibility` | ¿Quién puede pedir reembolso y en qué casos? |
| `refundHandler` | ¿El reembolso lo gestionas tú o Paddle? |
| `refundRequestWindow` | ¿Cuántos días hay para pedirlo? |
| `refundResponseTime` | ¿En cuánto respondes y devuelves el dinero? |
| `refundAfterCancel` | Al cancelar a mitad del mes pagado, ¿devuelves la parte no usada o no? |

### Contenido y reclamos (3)

| Campo | Pregunta |
|---|---|
| `restrictedCategories` | ¿Qué rubros no admites en los catálogos? (p. ej. armas, alcohol, medicamentos, tabaco) |
| `copyrightAckTime` | ¿En cuánto acusas recibo de un reclamo de derechos de autor? |
| `copyrightProcessTimes` | ¿Plazos para retirar contenido, avisar al mayorista y resolver? |

---

## 3. Regiones de proveedores (5) — están en los paneles

| Campo | Dónde mirarlo |
|---|---|
| `regionSupabase` | Panel de Supabase → Settings → General → Region (p. ej. `us-east-1`) |
| `regionWorkers` | Cloudflare Workers: indica que se ejecuta en su red global y, si lo sabes, la región de datos |
| `regionR2` | Cloudflare R2 → el bucket → Location |
| `regionPaddle` | Paddle (su sede está en Reino Unido; confirma su rol como vendedor ante tu cliente) |
| `dpaStatus` | ¿Tienes aceptado el contrato de tratamiento de datos (DPA) de Supabase, Cloudflare y Paddle? Guarda enlace y fecha |

---

## 4. Decisiones jurídicas (22 marcas `[PREGUNTAR A ABOGADO]`) — no las rellenes solo

Estas quedan marcadas a propósito en el texto. No se inventan: las contesta tu abogado con las preguntas de `RESUMEN_ABOGADO.md`. Dos campos son suyos y están en `LEGAL_DATA`:

| Campo | Pregunta |
|---|---|
| `governingLaw` | Ley aplicable al contrato |
| `jurisdiction` | Tribunales o mecanismo de resolución de disputas |

Lo demás (roles de responsable y encargado frente a los datos de los compradores, base jurídica de cada tratamiento, edad mínima, transferencias internacionales, límites de responsabilidad, derechos del consumidor, régimen de los avisos de derechos de autor) se queda marcado en el texto hasta que haya respuesta.

---

## 5. Además de rellenar datos

Cosas que no son un dato, pero faltan para lanzar:

1. **Aplicar las migraciones** `0005_legal_acceptance.sql` y `0006_purge_processed_webhooks.sql` en un entorno de prueba y luego en producción.
2. **Probar en Paddle sandbox:** contratar, cambiar de plan, cancelar y comparar el precio anunciado con el del último paso.
3. **Probar con una cuenta real:** descargar datos y borrar la cuenta.
4. **Revisar en navegador:** foco con teclado, lector de pantalla y las páginas legales. Correr axe o Lighthouse.
5. **Aclarar el origen de `src/app/favicon.ico`** (ver `CREDITS.md`) y confirmar la titularidad de los logos.
6. **Decidir sobre `sharp-libvips`** (LGPL-3.0, con componentes MPL-2.0) y la atribución de `caniuse-lite` (CC-BY-4.0), en `THIRD_PARTY_NOTICES.md`.
7. **Cambiar los nombres de marcas reales** usados como ejemplo en la maqueta de la landing, si tu abogado lo pide.
