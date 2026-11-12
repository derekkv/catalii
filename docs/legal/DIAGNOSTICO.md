# Diagnóstico de las 35 órdenes — Catalii

> **⚠️ Cómo leer este documento**
>
> Este documento está **por capas y en orden cronológico**: primero el
> diagnóstico inicial, después lo que se implementó.
>
> - El [**Resumen de conteo**](#resumen-de-conteo--histórico-fase-2) y la
>   [**Tabla de diagnóstico**](#tabla-de-diagnóstico--histórico-fase-2-antes-de-implementar)
>   son el **diagnóstico inicial (Fase 2)**: retratan el código **antes** de
>   implementar nada. **Sus estados ya no son los vigentes**: marcan FALTA en
>   varios puntos que hoy están hechos. Se conservan porque son el historial y
>   la evidencia `archivo:línea` que justificó cada cambio.
> - El **estado vigente** está al final, en
>   [**Estado tras la Fase 3**](#estado-tras-la-fase-3-2026-11-12) y en las
>   actualizaciones posteriores
>   ([textos y marca](#actualización-textos-publicados-y-marca-2026-11-12-posterior),
>   [maqueta de la landing](#actualización-marcas-en-la-maqueta-de-la-landing-2026-11-12-posterior)).
>   **Si solo vas a leer una cosa, lee esas.**
> - Lo que falta por hacer, con números de tarea, está en
>   [`PENDIENTES.md`](../../PENDIENTES.md).
>
> | Sección | Qué es | Vigencia |
> |---|---|---|
> | Resumen de conteo · Tabla de diagnóstico | Fase 2, estado inicial | **Histórico** |
> | Contraste (punto 6) — cálculo | Cálculo WCAG de `press` y `acero`, previo a la corrección | **Histórico** → vigente en [`ACCESIBILIDAD.md`](./ACCESIBILIDAD.md) |
> | FALTA de tipo TÉCNICO por riesgo · FALTA de TEXTO LEGAL o DECISIÓN | Plan de trabajo de la Fase 2 | **Histórico** (ya ejecutado en buena parte) |
> | PREGUNTAR A ABOGADO | Preguntas abiertas | Vigente (salvo donde se indique) |
> | Estado tras la Fase 3 + actualizaciones | Lo que hay hoy en el código | **Vigente** |

> **No es asesoría legal.** No afirma que la app «cumpla» ni «sea legal»: dice qué existe en el código (con evidencia `archivo:línea`) y qué falta. Fase 2 de la guía «35 puntos antes de lanzar tu app». Parte del [INVENTARIO.md](./INVENTARIO.md).

- Fecha del diagnóstico inicial: 2026-11-12 · Alcance: lectura de código en `/home/derek/Proyectos/catalii` (rama `main`). `backend/` no analizado.
- **Lo que NO se hizo:** no se abrió la app en navegador, no se corrió Lighthouse/axe, no se probó con lector de pantalla ni con teclado real, no se hizo ninguna compra de prueba en Paddle sandbox, no se miró la pestaña Red, no se leyó ningún `.env` ni producción. Todo lo marcado «HECHO» o «NO APLICA» se apoya en lectura/búsqueda de código, y así se indica.
- Estados: **HECHO** (existe, con evidencia) · **FALTA** · **NO APLICA** (con razón concreta) · **PREGUNTAR A ABOGADO**. Tipo: **TÉCNICO** / **TEXTO LEGAL** / **DECISIÓN**.

## Resumen de conteo — HISTÓRICO (Fase 2)

> Conteo del estado **inicial**, antes de implementar. Para el conteo que
> importa hoy, ve a [Estado tras la Fase 3](#estado-tras-la-fase-3-2026-11-12).

| Estado | Cantidad | Órdenes |
|---|---|---|
| HECHO | 3 | 7, 8, 25 |
| FALTA | 22 | 1, 2, 5, 6, 9, 11, 12, 13, 15, 16, 17, 18, 20, 22, 23, 26, 28, 29, 30, 32, 33, 35 |
| NO APLICA | 7 | 4, 10, 14, 19, 24, 27, 31 |
| PREGUNTAR A ABOGADO | 3 | 3, 21, 34 |

## Tabla de diagnóstico — HISTÓRICO (Fase 2, antes de implementar)

> ⚠️ **Los estados de esta tabla están superados.** Es la foto del código
> **antes** de implementar: donde dice FALTA, buena parte ya está hecha. Úsala
> solo como historial y como índice de evidencias (`archivo:línea`). El estado
> vigente de cada una de las 35 órdenes está en
> [Estado tras la Fase 3](#estado-tras-la-fase-3-2026-11-12) y en las
> actualizaciones que le siguen.

| # | Orden | Bloque | Estado | Evidencia | Qué falta | Tipo |
|---|---|---|---|---|---|---|
| 1 | Agrega una política de privacidad | PRIVACIDAD | FALTA | No existe ruta ni enlace: `src/app/` solo tiene `page.tsx`, `login`, `dashboard`, `c/[slug]`, `auth`, `api`; búsqueda `privacidad\|privacy` en `src/` → 0 resultados útiles. Footer landing `page.tsx:570-579` solo marca, dominio y ©. Formulario del comprador sin enlace `storefront.tsx:893-940`. Pie del catálogo público `c/[slug]/page.tsx:230-234` solo «Catálogo hecho con Catalii» | Página de privacidad (borrador) con responsable, datos del INVENTARIO §1, finalidades, destinatarios (§4), plazos, derechos; enlace en footer de landing, login, onboarding, formulario del comprador y catálogo público | TEXTO LEGAL |
| 5 | Define cuánto tiempo guardas los datos | PRIVACIDAD | FALTA | Sin política ni job: no hay `cron`/retención/caducidad en `src/` ni `supabase/migrations/*` (4 archivos). `processed_webhook` crece sin límite (`0001_init.sql:168-171`). Pedidos con nombre/WhatsApp/correo/notas de compradores sin plazo (`0001:110-130`) | Decidir plazos por tipo de dato (cuentas inactivas, pedidos, compradores, webhooks, logs) con el abogado; luego proceso programado de borrado/anonimizado | DECISIÓN |
| 12 | Permite descargar y borrar los datos | PRIVACIDAD | FALTA | No hay «Descargar mis datos» ni «Borrar mi cuenta» (`src/app/dashboard/configuracion/*` solo edita nombre/slug/WhatsApp/correo/tema `settings-form.tsx:40-91`; sin `deleteUser`/`admin.` en `src/`). El borrado en cascada de BD existe pero solo si alguien borra al usuario a mano en Supabase (`0001:16`); no borra R2; deja `paddle_customer.email` (`0001:144-152`, `on delete set null`) | Exportar JSON (cuenta, negocio, productos, catálogos, pedidos); borrar cuenta con confirmación propagando a R2, Paddle y Auth; canal de contacto para quien no pueda entrar. Toca BD/pagos/auth → plan y «ok» antes de código | TÉCNICO |
| 18 | No pidas datos que no necesitas | PRIVACIDAD | FALTA | Comprador: nombre y WhatsApp obligatorios, correo y notas opcionales (`storefront.tsx:893-940`) — razonable para el flujo, pero el placeholder de notas invita a escribir dirección. Registro: `full_name` opcional (`auth-form.tsx:139-140`, `login/actions.ts:61`) y **no se usa en ningún sitio** de `src/`. Doble captura: `business.email` y `business.whatsapp` además del email de login (`onboarding-form.tsx:62-76`). `catalii-buyer` guarda nombre/teléfono/correo del comprador sin aviso (`storefront.tsx:764`) | Propuesta (sin cambiar sin tu «ok»): quitar `full_name` o usarlo; decidir si el correo del comprador sigue siendo opcional y para qué; hacer «Recordar mis datos» opcional; texto de «por qué pedimos esto» junto al WhatsApp | DECISIÓN |
| 21 | Pide permiso a los padres para datos de menores | PRIVACIDAD | PREGUNTAR A ABOGADO | Producto B2B pero sin control de edad: ni registro (`auth-form.tsx:130-164`) ni pedido (`storefront.tsx:893-940`) preguntan edad; el pedido lo puede enviar cualquiera con el enlace (`place_order` concedido a `anon`, `0002_rls_and_rpc.sql:201`). Dueño: «NO SÉ» | Que el abogado decida si aplica (edad mínima, declaración «uso solo profesional/mayores de edad» en términos). No propongo flujo hasta tener edad definida | DECISIÓN |
| 3 | Agrega un banner de cookies | CONSENTIMIENTO | PREGUNTAR A ABOGADO | No existe banner. Cookies: solo `sb-*-auth-token` tras iniciar sesión (`lib/supabase/middleware.ts:35-41`; sin cookie no hay llamada a Supabase `middleware.ts:57-63`). Sin analítica/publicidad (ver 29/31). Pero hay `localStorage` con datos personales del comprador sin aviso (`catalii-buyer`, `storefront.tsx:733,764`), carrito (`:66,97,120`), tema (`theme-provider.tsx:6`) y aviso de dev (`dev-banner.tsx:8`) | Que el abogado diga si bastan las cookies «estrictamente necesarias» y si `catalii-buyer`/carrito/tema quedan exentos o requieren aviso/consentimiento, por país. Si no se requiere banner, aun así hace falta informarlo en la política de cookies/privacidad (1) | DECISIÓN |
| 15 | Pon una casilla sin marcar para aceptar los términos | CONSENTIMIENTO | FALTA | Solo hay una frase: «Al crear tu cuenta aceptas los términos del servicio.» (`auth-form.tsx:159-161`) sin enlace, sin casilla; los términos no existen (orden 2). Tampoco en el formulario del comprador ni en onboarding (`onboarding-form.tsx:107-110`) | Casilla vacía obligatoria en registro con «Acepto los Términos y he leído la Política de privacidad» (ambos enlazados); botón deshabilitado hasta marcar; validar también en servidor (`login/actions.ts:45`). Depende de 1, 2 y 22 | TÉCNICO |
| 4 | Pon un enlace de baja en tus correos | CONSENTIMIENTO | NO APLICA | No hay envío de correo comercial: sin dependencia de envío de correo en `package.json` (no resend/nodemailer/sendgrid…) ni llamadas de envío en `src/`. Los únicos correos son transaccionales de Supabase Auth (confirmación/recuperación, `login/actions.ts:62,103`) y recibos de Paddle. Plantillas de Supabase **no están en el repo** (no verificadas) | Si en el futuro hay boletines o correos de pedidos con fines comerciales, reabrir. Verificar que las plantillas de Auth no contengan publicidad (PREGUNTAR AL DUEÑO) | — |
| 24 | Pide permiso aparte para el marketing | CONSENTIMIENTO | NO APLICA | No hay captación de marketing ni listas: sin casilla, sin tabla, sin integración (ver INVENTARIO §5). Registro solo crea la cuenta (`login/actions.ts:57-64`) | Reabrir si se añade marketing. PREGUNTAR AL DUEÑO si Paddle muestra una casilla de marketing en su checkout | — |
| 31 | Bloquea los rastreadores hasta que acepten | CONSENTIMIENTO | NO APLICA | No hay rastreadores: `package.json` sin analítica/publicidad/píxeles/errores/chat; `src/` sin `<script src=…>` externos (solo JSON-LD propio `c/[slug]/page.tsx:143-146` y `ThemeScript` inline `theme-script.tsx:14`); fuentes autohospedadas por `next/font` (`layout.tsx:2`). El SDK de Paddle solo se carga en `/dashboard/facturacion` para completar el pago (`pricing-client.tsx:30`) | Prueba de red en ventana privada pendiente (no realizada). Reabrir si se añade cualquier SDK | — |
| 7 | Quita las cuentas regresivas falsas | HONESTIDAD | HECHO | Búsqueda de `countdown\|temporizador\|setInterval\|expira\|oferta\|últimas` en `src/`: sin ningún contador ni urgencia (solo mensajes de sesión caducada). Landing `page.tsx` sin relojes | Nada. Mantener. (Evidencia = ausencia verificada por búsqueda, no por prueba en navegador) | TÉCNICO |
| 13 | Quita los patrones engañosos | HONESTIDAD | FALTA | (a) «Aceptas los términos» como frase de relleno bajo el botón en vez de casilla (`auth-form.tsx:159-161`). (b) Bajar de plan abre un checkout nuevo con botón «Cambiar a …» (`pricing-client.tsx:109-119`): se presenta como cambio de plan pero compraría otra suscripción. (c) No hay forma de cancelar en la app (ver 17) mientras que contratar es un clic. (d) Aviso «en desarrollo» descartable, no engañoso (`dev-banner.tsx`) | Prueba con una persona ajena de alta/baja/consentimiento (no hecha). Arreglar (a), (b) y (c); botones equivalentes con el mismo peso | TÉCNICO |
| 19 | Quita las reseñas falsas | HONESTIDAD | NO APLICA | La landing no tiene reseñas, calificaciones ni testimonios con nombre: búsqueda `testimon\|reseñ\|review\|estrellas` en `src/` sin resultados. Ojo con la cita de la sección «Cita» (`page.tsx:386-394`: «Un pedido por WhatsApp son catorce mensajes… — Lo que escuchamos en cada bodega que visitamos»): no es una reseña de un cliente, pero sí una afirmación de investigación de campo sin soporte → ver 20 | Si se añaden reseñas, que sean reales y verificables | — |
| 20 | Quita las promesas que no puedes probar | HONESTIDAD | FALTA | Afirmaciones sin prueba en el repo: «10 min de archivo a enlace publicado» (`page.tsx:87`), «24/7 aunque tengas cerrado» (`:90`), «Gratis para siempre · Sin tarjeta» (`:363`), «Lo que escuchamos en cada bodega que visitamos» (`:392`), «Stock en tiempo real, precios por cliente» en la `description` SEO (`lib/site.ts:6-7`), «Importa tu CSV **o Excel**» (`page.tsx:41`; el campo solo acepta `.csv`, `products-client.tsx:472`). **Funciones de plan que no existen en el código:** Pro: «Multi-lista de precios», «Analytics»; Business: «Integración ERP», «API», «Marca blanca» (`plans.ts:46,55`; `price_list` y `customer` sin uso en `src/`; no hay analytics ni endpoint de API público). «20 pedidos/mes» del plan Gratis no se aplica (`maxOrdersPerMonth` sin comprobación) | Reescribir lo que no tenga prueba o implementarlo; mostrar solo lo que el producto hace hoy. El dueño decide qué promesas son ciertas (INVENTARIO §9 pregunta 16) | DECISIÓN |
| 25 | No presumas SOC 2 sin tenerlo | HONESTIDAD | HECHO | Búsqueda de `SOC ?2\|ISO 27001\|certific\|GDPR\|RGPD\|cumplimos` en `src/`, `README.md`, `package.json`: ninguna mención de certificaciones ni cumplimiento | Nada hoy. Mantener; si se escribe sobre seguridad, describir medidas reales (RLS: `0002_rls_and_rpc.sql:1-11`; cabeceras: `next.config.ts:4-17`) | TEXTO LEGAL |
| 33 | Promete una disponibilidad realista | HONESTIDAD | FALTA | La landing sugiere disponibilidad permanente: «24/7 · Recibiendo pedidos aunque tengas cerrado» (`page.tsx:90`). No hay SLA, página de estado ni monitoreo en el repo (solo `observability.enabled`, `wrangler.jsonc`) | Sustituir por texto realista («los pedidos se registran en cualquier momento») o definir un objetivo con respaldo de monitoreo. Decisión de redacción con el abogado | DECISIÓN |
| 10 | No uses logos de clientes sin permiso | DERECHOS DE AUTOR | NO APLICA | La landing no muestra logos de clientes ni sección «confían en nosotros»: `page.tsx` sin `<img>`/`<svg>` de marcas (solo íconos `lucide-react`). Las maquetas usan nombres inventados (`Distribuidora El Sol`, `Abarrotes Lupita`) y **productos con marca real como texto** (un refresco y una galleta de marca conocida, `page.tsx:233`) | Consultar al abogado si el uso de marcas como ejemplo en la maqueta es aceptable (lista de preguntas). Cambiar a genéricos es trivial. **Ya hecho**, ver [actualización final](#actualización-marcas-en-la-maqueta-de-la-landing-2026-11-12-posterior) | — |
| 11 | Verifica las licencias de imágenes, fuentes y código | DERECHOS DE AUTOR | FALTA | No hay archivo de créditos. `public/{file,globe,next,vercel,window}.svg` parecen el template `create-next-app` y no se usan en `src/` (sin referencias). `src/app/favicon.ico` de origen desconocido. Fuentes: Fraunces/Archivo/JetBrains Mono con `next/font/google` (`layout.tsx:2-27`; entiendo que son OFL, no verificado). Íconos `lucide-react` 0.469.0 (ISC). Sin `LICENSE` en el repo | Eliminar los svg sin uso; confirmar origen de `favicon.ico`; crear `CREDITS`/`THIRD_PARTY_NOTICES` con fuentes e íconos y su licencia (verificada en la fuente, no de memoria) | TÉCNICO |
| 23 | Cumple las licencias open source | DERECHOS DE AUTOR | FALTA | `npx license-checker --production --summary` (ejecutado; `node_modules` existe en la raíz): MIT 11, Apache-2.0 2, ISC 1, UNLICENSED 1 (el propio `catalii`, `private: true`). Sin GPL/AGPL a nivel directo. **Limitación:** solo se resolvieron 15 paquetes (primer nivel); `pnpm` no está disponible aquí y las transitivas no se verificaron. No existe `THIRD_PARTY_NOTICES` | Generar el archivo de avisos con todas las dependencias (incluidas transitivas) con un verificador que entienda pnpm y revisar copyleft. Apache-2.0 de Paddle exige conservar avisos | TÉCNICO |
| 26 | Ten un canal para reclamos de derechos de autor | DERECHOS DE AUTOR | FALTA | Los usuarios suben imágenes y textos que se publican (`api/uploads/route.ts`, `api/media/[...path]/route.ts:31-36`) y catálogos indexables (`sitemap.ts`). No hay página «Derechos de autor», correo ni formulario de reclamos | Página de reclamos con correo/formulario y procedimiento (borrador); mecanismo para retirar un catálogo/imagen. Si aplica agente DMCA en EE. UU., lo decide el abogado | TEXTO LEGAL |
| 16 | Agrega una política de reembolsos | PAGOS | FALTA | Se cobra (`pricing-client.tsx:36-47`) pero no hay política de reembolsos ni enlace en la pantalla de planes (`facturacion/page.tsx`, `pricing-client.tsx`) ni en la landing (`page.tsx:541-543` solo dice «Pagos con Paddle. Puedes cambiar o cancelar cuando quieras») | Borrador de política (quién, cómo, plazos) enlazado junto al botón de pago y en la landing; el contenido legal (desistimiento por país) lo define el abogado | TEXTO LEGAL |
| 17 | Que cancelar sea tan fácil como suscribirse | PAGOS | FALTA | Contratar = un clic («Mejorar a Pro», `pricing-client.tsx:109-119`). **No hay botón «Cancelar suscripción» ni enlace al portal de Paddle** en `facturacion/page.tsx` o `pricing-client.tsx`. El webhook sí procesa `subscription.canceled` (`process-webhook.ts:30-33,97-99`), así que la cancelación solo ocurriría fuera de la app (por Paddle). La landing promete «Puedes cambiar o cancelar cuando quieras» (`page.tsx:541-542`) | Botón «Cancelar suscripción» en Facturación (y confirmación), mismo medio que contrata; definir si se usa API de Paddle o portal del cliente. Toca pagos → plan y «ok» antes de código | TÉCNICO |
| 28 | Avisa de la renovación automática | PAGOS | FALTA | Junto al botón de pago solo hay «/mes» (`pricing-client.tsx:90-93`, `page.tsx:508-511`): no dice que se renueva, cada cuánto, cuándo es el próximo cobro ni cómo cancelar. Hay aviso de «cambio programado» (`facturacion/page.tsx:65-78`) pero no del próximo cobro. Lo que Paddle muestre en su overlay **no está en el repo** (no verificado) | Texto «Se renueva cada mes hasta que canceles. Cancela cuando quieras en Facturación» junto al botón y en la landing; mostrar próxima fecha de cobro si Paddle la entrega por webhook; revisar el checkout en sandbox. Recordatorios por correo: decisión con el abogado | TÉCNICO |
| 34 | Quita los cargos ocultos | PAGOS | PREGUNTAR A ABOGADO | Los precios mostrados son literales: `$0/$19/$49/$99` (`plans.ts:28,35,43,52`) sin moneda ni mención de impuestos; el importe real lo fija Paddle por `priceId` (`pricing-client.tsx:36-38`). No se puede comparar landing vs último paso sin una compra de prueba (no hecha). Si Paddle añade impuestos en el checkout, el precio final podría diferir | Hacer compra de prueba en sandbox y comparar; indicar moneda («USD») e impuestos en las tarjetas de plan; que el abogado confirme cómo mostrar el precio total según país. PREGUNTAR AL DUEÑO: ¿impuestos incluidos? | DECISIÓN |
| 2 | Agrega términos y condiciones | TÉRMINOS | FALTA | No existe página ni enlace; la única mención es la frase sin enlace de `auth-form.tsx:159-161` | Borrador de términos (servicio, precios, renovación, cancelación, reembolsos, responsabilidad, ley aplicable, contacto; incluir cuál es el papel del mayorista frente a datos de sus compradores) con fecha y versión; enlace en footer y registro | TEXTO LEGAL |
| 22 | Registra quién aceptó los términos y cuándo | TÉRMINOS | FALTA | No hay tabla de aceptaciones ni columna: `supabase/migrations/0001..0004` solo definen business/product/catalog/…/paddle_*; `signUp` solo manda `full_name` como metadata (`login/actions.ts:57-64`) | Tabla `legal_acceptance` (usuario, documento, versión, UTC, método) escrita al aceptar términos/marketing/cookies. **Toca BD/auth: enseñar el esquema y esperar «ok» antes de la migración** | TÉCNICO |
| 35 | Agrega los datos de contacto de tu empresa | TÉRMINOS | FALTA | Footer de la landing: marca, `catalii.com · Catálogos digitales para mayoristas`, `© año` (`page.tsx:570-579`). Ningún correo, nombre legal ni domicilio en `src/` (búsqueda de `mailto\|contacto\|soporte` sin resultados útiles). Catálogo público: sin datos de la empresa (`c/[slug]/page.tsx:230-234`) | Página/pie con nombre legal, domicilio, correo y identificación fiscal marcados `[COMPLETAR]`. **PREGUNTAR AL DUEÑO** los datos reales (no inventar) | TEXTO LEGAL |
| 6 | Arregla el contraste de colores | ACCESIBILIDAD | FALTA | Cálculo propio abajo (§Contraste) para `press` y `acero` con la fórmula WCAG 2.x: los pares de texto principales pasan (≥4,5) **excepto el texto de marcador (`placeholder`)**: `muted-foreground` al 70 % sobre `card` = **3,16:1** en `press` y **3,17:1** en `acero` (`ui/input.tsx:18`) → no llega a 4,5:1. Los otros 3 themes (`noche`, `mercado`, `hueso`) **no se calcularon**. No se corrió Lighthouse/axe | Subir el color del placeholder (p. ej. quitar `/70`), calcular los 3 themes restantes y correr axe/Lighthouse en landing, login, panel y catálogo | TÉCNICO |
| 8 | Agrega texto alternativo a las imágenes | ACCESIBILIDAD | HECHO | Todas las `<img>` del código tienen atributo `alt`: informativas con nombre (`storefront.tsx:396` `alt={p.name}`, `:569` «…foto N de M», `share-card.tsx:77` «Código QR del catálogo…», `product-images-field.tsx:164`), decorativas con `alt=""` (logo y banner junto al nombre `c/[slug]/page.tsx:157,194`; miniaturas `storefront.tsx:591`; avatar `dashboard/layout.tsx:50`; `products-client.tsx:347`; `brand-image-upload.tsx:108`). Íconos `lucide` con `aria-hidden="true"` y botones de ícono con `aria-label` (p. ej. `auth-form.tsx:78`, `storefront.tsx:221`). Sin `<Image>` de Next | Falta la prueba con lector de pantalla (VoiceOver/NVDA) que pide la guía; revisar que `alt=""` en `brand-image-upload.tsx:108` sea realmente decorativo | TÉCNICO |
| 9 | Activa la navegación con teclado | ACCESIBILIDAD | FALTA | **Hay:** enlace «Saltar al contenido» (`layout.tsx:80-83`); regla global de foco visible de 3 px (`globals.css:298-302`) para enlaces, inputs, etc.; modales con Escape, trampa de foco y devolución de foco (`ui/overlay.tsx:42-82`, `aria-modal` `:131,:203`); inputs con anillo de foco (`ui/input.tsx:20`). **Problema:** el componente `Button` aplica `focus-visible:outline-none` **sin sustituirlo por un anillo** (`ui/button.tsx:23`); como las utilidades de Tailwind prevalecen sobre la regla global (que está en `@layer base`, `globals.css:298`), por lectura del código los botones no muestran foco visible (afecta a «Entrar», «Crear mi cuenta», «Enviar pedido», «Mejorar a…», etc.). **No verificado en navegador** | Añadir anillo de foco a `Button` (`focus-visible:ring-…`), repasar `order-status-select.tsx:66`/`storefront.tsx:238` que sí traen anillo, y probar registro, pedido y pago solo con teclado | TÉCNICO |
| 29 | Audita los SDKs, la analítica y el rastreo | PROVEEDORES | FALTA | Lista elaborada en INVENTARIO §3 a partir de `package.json` y `src/`: ninguna analítica/anuncios; SDKs de Supabase y Paddle; `localStorage` propio | Prueba real en pestaña Red (ventana privada) en landing, login, catálogo y facturación, anotando dominios (p. ej. los de Paddle) y compararla con la lista; repetir cuando se añada algo | TÉCNICO |
| 30 | Firma acuerdos de datos con tus proveedores | PROVEEDORES | FALTA | Sin evidencia en el repo de DPA con Supabase, Cloudflare ni Paddle (no es algo que viva en código). Proveedores en INVENTARIO §4 | PREGUNTAR AL DUEÑO: aceptar/descargar el DPA de cada proveedor, guardar enlace y fecha; confirmar región y mecanismo de transferencia (pregunta de abogado 11) | DECISIÓN |
| 32 | Publica qué proveedores procesan datos | PROVEEDORES | FALTA | No existe la página (ver 1). Proveedores identificados en INVENTARIO §4 | Sección/página «Proveedores» con función y país de Supabase, Cloudflare, Paddle (y SMTP si aplica); países `[COMPLETAR]` | TEXTO LEGAL |
| 14 | Etiqueta el contenido hecho con IA | IA | NO APLICA | La app no genera contenido con IA: sin SDK de IA en `package.json`; sin llamadas a APIs de IA en `src/` (ver INVENTARIO §6) | Reabrir si se añade IA. PREGUNTAR AL DUEÑO si el copy/imágenes de la landing se generaron con IA | — |
| 27 | No entrenes a la IA con datos de usuarios sin permiso | IA | NO APLICA | Sin funciones de IA ni envío de datos de usuarios a ningún proveedor de IA (mismas pruebas que 14) | Reabrir si se añade IA | — |

## Contraste (punto 6) — cálculo — HISTÓRICO (Fase 2)

> ⚠️ Cálculo **previo a la corrección** y solo de dos themes (`press` y
> `acero`). El fallo que detecta (placeholder al 70 % → 3,16:1) **ya está
> corregido**: se quitó la opacidad en `src/components/ui/input.tsx`. Los
> cálculos vigentes, con los cinco themes y los valores posteriores al arreglo,
> están en [`ACCESIBILIDAD.md`](./ACCESIBILIDAD.md).

Fórmula (WCAG 2.x): canal sRGB `c = v/255`; lineal `c' = c/12,92` si `c ≤ 0,03928`, si no `((c+0,055)/1,055)^2,4`; luminancia `L = 0,2126·R' + 0,7152·G' + 0,0722·B'`; razón `(L_claro + 0,05)/(L_oscuro + 0,05)`. Umbrales: 4,5:1 texto normal, 3:1 texto grande y componentes de interfaz. Colores tomados de `src/app/globals.css` (bloques `[data-theme="press"]` y `:where(:root), [data-theme="acero"]`). Cálculo ejecutado con un script de Node (sin librerías).

**Theme `press`**

| Par (texto / fondo) | Colores | Razón | ¿≥ umbral? |
|---|---|---|---|
| foreground / background | `#1a1714` / `#fbf8f3` | 16,85 | Sí (4,5) |
| foreground / card | `#1a1714` / `#ffffff` | 17,85 | Sí |
| muted-foreground / background | `#6b6054` / `#fbf8f3` | 5,79 | Sí |
| muted-foreground / card | `#6b6054` / `#ffffff` | 6,13 | Sí |
| muted-foreground / muted | `#6b6054` / `#f1ebe1` | 5,17 | Sí |
| on-primary / primary (botón) | `#fdfbf7` / `#b43b1f` | 5,67 | Sí |
| primary / background (enlaces, etiquetas) | `#b43b1f` / `#fbf8f3` | 5,53 | Sí |
| primary / muted | `#b43b1f` / `#f1ebe1` | 4,94 | Sí |
| on-secondary / secondary (sección de cierre) | `#fbf8f3` / `#1f1b16` | 16,16 | Sí |
| on-secondary al 80 % / 70 % sobre secondary (`page.tsx` `opacity-80`/`opacity-70`) | mezcla | 10,69 / 8,47 | Sí |
| accent / background | `#1f1b16` / `#fbf8f3` | 16,16 | Sí |
| destructive / background | `#a82414` / `#fbf8f3` | 6,77 | Sí |
| on-destructive / destructive | `#fdfbf7` / `#a82414` | 6,94 | Sí |
| success / background; on-success / success | `#1f6b43` | 6,11; 6,48 | Sí |
| warning / background; on-warning / warning | `#8a5a10` | 5,58; 5,91 | Sí |
| `--input` (borde de campo) / background (UI, 3:1) | `#9a8a75` / `#fbf8f3` | 3,16 | Sí (3:1) |
| **placeholder** (muted-foreground 70 % sobre card) | mezcla sobre `#ffffff` | **3,16** | **No (4,5)** |
| `--rule` (separadores decorativos) / background | `#e3dacb` / `#fbf8f3` | 1,31 | n/a (decorativo) |

**Theme `acero` (por defecto)**

| Par | Colores | Razón | ¿≥ umbral? |
|---|---|---|---|
| foreground / background | `#161d24` / `#f5f7f8` | 15,82 | Sí |
| foreground / card | `#161d24` / `#ffffff` | 17,00 | Sí |
| muted-foreground / background | `#556370` / `#f5f7f8` | 5,74 | Sí |
| muted-foreground / card | `#556370` / `#ffffff` | 6,17 | Sí |
| muted-foreground / muted | `#556370` / `#e8edf0` | 5,23 | Sí |
| on-primary / primary | `#f4f8fb` / `#1b3a5c` | 10,89 | Sí |
| primary / background; primary / muted | `#1b3a5c` | 10,82; 9,86 | Sí |
| on-secondary / secondary | `#f4f8fb` / `#16202b` | 15,42 | Sí |
| on-secondary al 80 % / 70 % | mezcla | 10,28 / 8,14 | Sí |
| on-accent / accent (botón acento) | `#fffaf5` / `#b2561b` | 4,77 | Sí (margen estrecho) |
| accent / background (texto en acento) | `#b2561b` / `#f5f7f8` | 4,61 | Sí (margen estrecho) |
| destructive / background; on-destructive / destructive | `#a82414` | 6,68; 6,94 | Sí |
| success / background; on-success / success | `#1f6b43` | 6,03; 6,48 | Sí |
| warning / background; on-warning / warning | `#8a5a10` | 5,50; 5,91 | Sí |
| `--input` (borde de campo) / background (UI) | `#83909b` / `#f5f7f8` | 3,04 | Sí (3:1, margen estrecho) |
| **placeholder** (70 % sobre card) | mezcla sobre `#ffffff` | **3,17** | **No (4,5)** |

Notas: (1) El texto `.t-label` es de 11 px (0,6875 rem, `globals.css`) y hasta 9 px en maquetas (`text-[0.5625rem]`): cuenta como texto normal (4,5:1), no grande; los pares con `muted-foreground` lo cumplen. (2) Los estados `disabled` bajan a `opacity-45/60` (`ui/button.tsx:24`, `ui/input.tsx:21`); WCAG exime a controles inactivos, pero conviene revisarlos. (3) Contraste sobre fotos o degradados de usuario (banners) no se puede calcular estáticamente. (4) `noche`, `mercado` y `hueso` están sin calcular.

---

## FALTA de tipo TÉCNICO, ordenados por riesgo — HISTÓRICO (plan de la Fase 2)

> ⚠️ Es el **plan de trabajo** que salió del diagnóstico inicial, no una lista
> de pendientes actual: las prioridades 1 a 7 ya se ejecutaron (ver
> [Estado tras la Fase 3](#estado-tras-la-fase-3-2026-11-12)). Los pendientes
> vigentes están en [`PENDIENTES.md`](../../PENDIENTES.md).

Esfuerzo: S ≤ medio día · M ≈ 1-2 días · L > 2 días.

Riesgo según mi criterio técnico/operativo (el abogado puede reordenar).

| Prioridad | Órdenes | Qué es | Esfuerzo | ¿Pide «ok» previo? |
|---|---|---|---|---|
| 1 | 17 + 28 | Botón «Cancelar suscripción» en Facturación (API de Paddle o portal) y aviso de renovación automática junto al botón de pago y en la landing | M | **Sí** (toca pagos) |
| 2 | 15 + 22 | Casilla de términos sin marcar + tabla de aceptaciones con versión/UTC/método (y validación en servidor). Necesita primero los textos 1 y 2 | M | **Sí** (BD + auth: enseñar esquema) |
| 3 | 12 | «Descargar mis datos» (JSON) y «Borrar mi cuenta» con propagación a R2, Paddle y Auth; limpieza de `paddle_customer.email` | L | **Sí** (BD + pagos + auth) |
| 4 | 13 | Corregir «Cambiar a …» (bajar de plan no debe abrir un checkout nuevo), texto de consentimiento y prueba con tercero | S–M | Sí (pagos) para el punto de bajar de plan |
| 5 | 9 | Anillo de foco visible en `Button` y prueba solo con teclado de registro, pedido y pago | S | No |
| 6 | 6 | Corregir contraste de placeholder, calcular `noche`/`mercado`/`hueso`, correr axe/Lighthouse antes y después | S | No |
| 7 | 11 | Eliminar `public/*.svg` del template sin uso; confirmar `favicon.ico`; crear `CREDITS`/`THIRD_PARTY_NOTICES` parcial | S | No |
| 8 | 23 | Avisos de licencias completos (transitivas, con herramienta compatible con pnpm); marcar GPL/AGPL | S | No |
| 9 | 29 | Prueba de red en ventana privada y registro de dominios (landing, login, catálogo, facturación) | S | No |
| — | 8 | Solo falta la prueba con lector de pantalla (el estado es HECHO) | S | No |

**Hallazgos técnicos adicionales** (no son una de las 35 órdenes pero salieron al revisar): (a) el límite `maxOrdersPerMonth` del plan Gratis no se hace cumplir (`plans.ts:29`); (b) `place_order` es invocable por `anon` sin limitación de frecuencia visible (`0002:201`) y almacena nombre/teléfono de terceros; (c) `processed_webhook` crece sin límite (`0001:168-171`); (d) no hay Content-Security-Policy (`next.config.ts:4-17`); (e) el campo `full_name` se guarda pero nunca se usa; (f) `business.email` se usa como llave para enlazar con Paddle (`process-webhook.ts:46-50`): si el mayorista cambia ese correo, deja de enlazar con su suscripción (riesgo funcional/fiscal).

## FALTA / pendientes de TEXTO LEGAL o DECISIÓN — HISTÓRICO (Fase 2)

> ⚠️ Los seis textos de la primera lista **ya están publicados** (Fase 3). Lo
> que sigue abierto son las decisiones del dueño y del abogado, que se siguen en
> [`DATOS-PENDIENTES.md`](./DATOS-PENDIENTES.md) y en
> [`PENDIENTES.md`](../../PENDIENTES.md) #2–#8.

- **Textos (borrador, a redactar en Fase 3 y revisar por abogado):** 1 privacidad · 2 términos · 16 reembolsos · 26 reclamos de derechos de autor · 32 proveedores · 35 contacto · (cookies/almacenamiento si el abogado lo pide) · aviso de IA no aplica.
- **Decisiones del dueño con su abogado:** 5 plazos de retención · 18 minimización · 20 y 33 qué promesas se mantienen · 21 menores · 30 DPAs · 34 impuestos/moneda.

## PREGUNTAR A ABOGADO (lista concreta)

Referencias a las 25 preguntas del capítulo 6 de la guía entre paréntesis.

1. (1, 2) ¿Qué leyes de datos y consumo aplican a Catalii según el país de la empresa (**PREGUNTAR AL DUEÑO**) y los de mayoristas y compradores? Si hay usuarios en la UE sin oficina allí, ¿hace falta representante?
2. (3, 7) ¿Hace falta delegado/encargado de datos o inscribir bases de datos en algún país?
3. (4) ¿Qué base legal corresponde a cada finalidad del inventario (cuenta, pedido de comprador, facturación, seguridad, `localStorage` del comprador)? ¿Dónde se necesita consentimiento expreso?
4. **Roles sobre los datos de compradores:** el mayorista recoge nombre/WhatsApp/correo/notas de sus compradores usando Catalii. ¿Quién es responsable y quién encargado? ¿Quién debe dar el aviso de privacidad en el formulario del comprador y cómo lo enlazamos? ¿Qué contrato (encargo de tratamiento) debe aceptar el mayorista?
5. (5) ¿Qué plazos de conservación son razonables para cuentas, pedidos, compradores, webhooks y logs, y qué datos obliga otra ley a guardar (facturas, impuestos)? ¿Qué pasa con `paddle_customer.email` tras el borrado?
6. (6) ¿Trato datos sensibles sin darme cuenta (p. ej., en las notas libres del pedido, dirección de entrega, fotos con personas)?
7. (8, 9) ¿Debo declarar edad mínima / «solo uso profesional» y cómo se trata a un menor que pida por el enlace público?
8. (14) ¿Se necesita banner de cookies o aviso para `localStorage` (`catalii-buyer`, carrito, tema) además de las cookies de sesión? ¿Cambia por país?
9. (10, 11) ¿Bastan los DPA estándar de Supabase, Cloudflare y Paddle? ¿Qué mecanismo de transferencia internacional y qué decirle al usuario? (**PREGUNTAR AL DUEÑO** las regiones.)
10. (15) ¿Cómo y cuánto tiempo debo guardar la prueba de aceptación de términos y de consentimientos?
11. (16) ¿Mi flujo de suscripción/cancelación y los avisos de renovación cumplen las normas de consumo de mis países? ¿Qué recordatorios por correo y con cuánta antelación?
12. (17) ¿Qué desistimiento/reembolso corresponde por país y cómo lo redacto sin recortar derechos? ¿Rol de Paddle (si es quien vende ante el cliente final) en reembolsos e impuestos?
13. (18) ¿Qué canal de reclamos de derechos de autor necesito por el contenido que suben los mayoristas? ¿Agente DMCA en EE. UU.?
14. (19) Con las dependencias actuales (MIT, Apache-2.0, ISC en primer nivel), ¿qué avisos de licencia debo incluir y bastan? ¿Qué licencia asigno al propio código?
15. (21, 22, 23) Revisión de los borradores de privacidad, términos, reembolsos y cookies; datos de empresa a publicar y dónde; qué puedo decir (y qué no) sobre seguridad y disponibilidad.
16. **Marcas en la maqueta de la landing:** ~~¿es aceptable usar nombres de productos con marca real en las vistas previas, o debo usar genéricos?~~ **Resuelto sin consulta:** la maqueta ya usa nombres genéricos (ver [actualización final](#actualización-marcas-en-la-maqueta-de-la-landing-2026-11-12-posterior)). Queda como pregunta solo si en algún momento se quiere volver a usar marcas de terceros en material promocional.
17. **Afirmaciones comerciales:** revisión de las promesas de la landing y de las funciones de plan que hoy no existen (Analytics, API, ERP, Marca blanca, Multi-lista, Excel) antes de publicar precios.
18. (24) Plan de respuesta a incidentes: a quién se avisa, en qué plazo, qué preparar.
19. (25) Mínimo imprescindible para el día del lanzamiento y qué puede esperar.


---

# Estado tras la Fase 3 (2026-11-12)

> **Esta es la sección vigente** (junto con las actualizaciones que la siguen).
> **Actualiza** la tabla de arriba, que conserva el estado de la Fase 2. Cuando se escribió no había commits, por eso no se citan hashes; los cambios ya están commiteados en `main` (`git log`). Verificación hecha: `tsc --noEmit`, `eslint .` y `next build` sin errores. **No** se probó en navegador, ni con Paddle sandbox, ni con Supabase/R2 reales; las migraciones **no** se ejecutaron.

| # | Orden | Estado nuevo | Evidencia (archivo) | Pendiente |
|---|---|---|---|---|
| 1 | Privacidad | BORRADOR publicado (noindex) | `src/app/privacidad/page.tsx`, `src/lib/legal/content.ts`, `docs/legal/borradores/privacidad.md` | Datos reales `[COMPLETAR]`; revisión legal |
| 2 | Términos | BORRADOR publicado (noindex) | `src/app/terminos/page.tsx` | Ley aplicable, responsabilidad: abogado |
| 3 | Cookies | PREGUNTAR A ABOGADO (sin cambios) | Informado en la política de privacidad (almacenamiento local) | ¿Basta con «estrictamente necesarias»? |
| 4 | Baja en correos | NO APLICA | — | Reabrir si hay correo comercial |
| 5 | Plazos de conservación | PARCIAL | `supabase/migrations/0006_purge_processed_webhooks.sql` (solo ledger técnico, sin programar) | DECISIÓN: plazos de cuentas, pedidos y compradores |
| 6 | Contraste | HECHO (cálculo), sin axe/Lighthouse | `docs/legal/ACCESIBILIDAD.md`, `ui/input.tsx`, `globals.css` | Correr axe/Lighthouse y revisar en navegador |
| 7 | Cuentas regresivas | HECHO | (sin cambios) | — |
| 8 | Texto alternativo | HECHO | `media/brand-image-upload.tsx` | Prueba con lector de pantalla |
| 9 | Teclado | HECHO (por código) | `ui/button.tsx` (anillo), selects con `--ring` | Prueba solo con teclado en navegador |
| 10 | Logos de clientes | NO APLICA | — | Marcas como ejemplo en maqueta: resuelto después con genéricos (ver [actualización final](#actualización-marcas-en-la-maqueta-de-la-landing-2026-11-12-posterior)) |
| 11 | Licencias de recursos | HECHO | `CREDITS.md`, 5 SVG del template eliminados | Origen de `favicon.ico`: dueño |
| 12 | Descargar/borrar datos | HECHO (sin probar en vivo) | `api/account/export/route.ts`, `dashboard/configuracion/account-actions.ts`, `data-section.tsx` | Prueba con cuenta real; Paddle no borra clientes: abogado |
| 13 | Patrones engañosos | HECHO (por código) | `facturacion/pricing-client.tsx`, `confirm-dialog.tsx`, casilla de registro | Prueba con una persona ajena |
| 14 | Etiquetar IA | NO APLICA | — | — |
| 15 | Casilla de términos | HECHO | `login/auth-form.tsx`, `login/actions.ts` | — |
| 16 | Reembolsos | BORRADOR publicado + enlazado en pago | `src/app/reembolsos/page.tsx`, `pricing-client.tsx` | Plazos `[COMPLETAR]`; abogado |
| 17 | Cancelar = suscribirse | HECHO (sin probar con Paddle) | `facturacion/actions.ts`, `cancel-subscription-button.tsx` | Probar en sandbox |
| 18 | Minimización | HECHO | `full_name` eliminado; «Recordar mis datos» opcional (`c/[slug]/storefront.tsx`) | Decidir si el correo del comprador sigue |
| 19 | Reseñas falsas | NO APLICA | — | — |
| 20 | Promesas sin prueba | HECHO | `lib/plans.ts`, `app/page.tsx`, `lib/site.ts` | `maxOrdersPerMonth` del plan Gratis no se aplica |
| 21 | Menores | PREGUNTAR A ABOGADO | — | Edad mínima |
| 22 | Registro de aceptación | HECHO (SQL no ejecutado) | `supabase/migrations/0005_legal_acceptance.sql`, `src/lib/legal/acceptance.ts` | Aplicar migración; hueco si falla el insert |
| 23 | Licencias OSS | HECHO | `THIRD_PARTY_NOTICES.md` (112 paquetes de producción) | Revisar LGPL de `sharp-libvips` y CC-BY de `caniuse-lite` |
| 24 | Marketing | NO APLICA | — | — |
| 25 | SOC 2 | HECHO | (sin menciones) | — |
| 26 | Reclamos de autor | BORRADOR publicado | `src/app/derechos-de-autor/page.tsx` | Correo `[COMPLETAR]`; régimen (DMCA/DSA): abogado |
| 27 | Entrenar IA | NO APLICA | — | — |
| 28 | Aviso de renovación | HECHO (sin probar con Paddle) | `facturacion/pricing-client.tsx` | Verificar el overlay de Paddle |
| 29 | Auditoría de SDKs | PARCIAL (estática) | `docs/legal/AUDITORIA_SDKS.md` | Prueba real en pestaña Red |
| 30 | DPA con proveedores | FALTA | — | DECISIÓN del dueño: aceptar y guardar DPAs |
| 31 | Bloquear rastreadores | NO APLICA | — | Reabrir si se añade analítica |
| 32 | Publicar proveedores | BORRADOR publicado | `src/app/proveedores/page.tsx` | País/región `[COMPLETAR]` |
| 33 | Disponibilidad realista | HECHO | `app/page.tsx` | — |
| 34 | Cargos ocultos | PARCIAL | «USD» y nota de impuestos en tarjetas | Compra de prueba; ¿impuestos incluidos? |
| 35 | Datos de contacto | BORRADOR publicado | `src/app/contacto/page.tsx`, pie de la landing | Datos reales: dueño |

**Hallazgos nuevos:** (a) el webhook de Paddle ya ignora `customer.updated` de clientes cuyo correo fue vaciado al borrar la cuenta (`process-webhook.ts`); (b) si el insert de `legal_acceptance` falla, el alta continúa y solo queda en logs; (c) `paddle_subscription` se enlaza al negocio por `business.email`, así que un correo distinto en Paddle impide cancelar desde la app; (d) sigue sin haber CSP.

## Actualización: textos publicados y marca (2026-11-12, posterior)

Cambios respecto a la tabla de arriba:

- **Se retiró el tratamiento de «borrador».** Las 6 páginas ya no llevan el aviso de borrador ni la versión `-borrador`; la versión vigente es `2026-11-12`. En su lugar, cada página avisa «Documento incompleto» **solo mientras le falten datos** y se sirve con `noindex` automático (`hasPendingData`, `src/lib/legal/content.ts`). Verificado en el HTML servido por `next start`: `<meta name="robots" content="noindex">` en `/privacidad`, sin ninguna aparición de la palabra «borrador».
- **Los datos pendientes se centralizaron.** Los 33 `[COMPLETAR]` dispersos en `content.ts` pasaron a `COMPANY` y `LEGAL_DATA` en `src/lib/legal/config.ts` (35 campos). `missingLegalData()` los enumera y `pnpm legal:export` los lista. Detalle de cada campo: `DATOS-PENDIENTES.md`.
- **Tres huecos se cerraron con hechos del código**, no con suposiciones: la moneda de cobro (`USD`, desde `PLAN_CURRENCY`), que descargar y borrar datos ya existe en Configuración, y que la cancelación desde Facturación existe y se programa al final del periodo pagado.
- **Los Markdown se generan**, ya no se escriben a mano: `docs/legal/borradores/` pasó a `docs/legal/textos/`, producido por `scripts/export-legal.ts`. Así la web y los archivos no pueden divergir.
- **Orden 11 (licencias de recursos): cerrada.** `src/app/favicon.ico` se regeneró desde `catalii-simbolo-v2.png` con ImageMagick, junto con `icon.svg` y `apple-icon.png` (180×180). Ya no queda ningún icono de origen desconocido, que era el único pendiente de ese punto.
- **Marca:** la aplicación usa los logos V2 del dueño (`public/brand/*-v2*`) mediante `src/components/brand/brand-logo.tsx`, con imagen Open Graph real. Las fuentes editables se movieron a `docs/brand/` para no servirlas en `public/`.

Verificación de esta tanda: `tsc --noEmit`, `eslint .` y `next build` sin errores (25 páginas estáticas); HTML comprobado con `next start` en `/`, `/privacidad`, `/terminos` y `/contacto` (200). Sigue sin probarse en navegador, con Paddle sandbox ni con Supabase/R2 reales, y las migraciones `0005`/`0006` siguen sin ejecutar.

## Actualización: marcas en la maqueta de la landing (2026-11-12, posterior)

Cierra el único pendiente que quedaba de la **orden 10** (logos y marcas de
terceros) y la pregunta 16 de la lista del abogado.

- **La landing ya no usa nombres de productos con marca real.** La vista previa
  del catálogo (`PriceListPreview`, `src/app/page.tsx`) usa genéricos:
  «Refresco de cola 600 ml» (SKU `RC-600`) y «Galletas surtidas 170 g» (SKU
  `GS-170`), junto al «Aceite vegetal 1 L» que ya era genérico. Los precios, las
  presentaciones y el total del pedido ($718.80 = 24 × 12,50 + 12 × 34,90) no
  cambiaron. Los nombres de negocio de las maquetas (`Distribuidora El Sol`,
  `Abarrotes Lupita`, `Tienda Don Beto`, `Minisúper La Esquina`) ya eran
  inventados.
- **El ejemplo de CSV del README** también pasó a un nombre genérico.
- **Estado de la orden 10:** NO APLICA, ya sin la salvedad de las marcas en la
  maqueta. No hace falta esperar al abogado para esto.
- **Queda fuera de este cambio** (hay marcas reales como texto de ejemplo en
  otros archivos, pendiente de quien los mantenga):
  `src/app/dashboard/productos/product-form.tsx` (placeholder del campo
  «nombre»), `src/app/dashboard/productos/products-client.tsx` (`CSV_TEMPLATE`,
  que es la plantilla que se descarga el usuario), `CREDITS.md` §«Marcas y
  ejemplos» e `INVENTARIO.md` §7, que siguen citando los nombres antiguos.

Verificación: `eslint src/app/page.tsx` y `tsc --noEmit` sin errores. No se
revisó en navegador.
