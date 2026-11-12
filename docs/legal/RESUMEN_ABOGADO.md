# Catalii — resumen para revisión legal (una página)

Material técnico, no asesoría legal. Nada de lo siguiente afirma cumplimiento normativo.

**Producto.** SaaS B2B de catálogos digitales para mayoristas (Next.js, Supabase, Paddle, Cloudflare R2). Los mayoristas (cuenta con correo y contraseña) publican catálogos; sus compradores, sin cuenta, envían pedidos con nombre, WhatsApp, correo (opcional) y notas. Suscripciones mensuales con Paddle (Gratis, Starter, Pro, Business).

**Datos pendientes:** 35 campos en `src/lib/legal/config.ts` (razón social, domicilio, identificación fiscal, país, correos, plazos de conservación, ley aplicable, regiones de proveedores…). Lista con el detalle: `docs/legal/DATOS-PENDIENTES.md`.

## Qué se hizo (técnico)
- Los seis textos (privacidad, términos, reembolsos, derechos de autor, proveedores, contacto) están publicados en el sitio. Fuente única: `src/lib/legal/content.ts` + `src/lib/legal/config.ts`; copias en Markdown en `docs/legal/textos/`. Mientras a un documento le falten datos, se avisa en la propia página y no se indexa.
- Casilla de términos y privacidad sin marcar en el registro + tabla `legal_acceptance` (usuario, documento, versión, fecha UTC, método; sin IP). Migración escrita, **no ejecutada**.
- «Descargar mis datos» (JSON) y «Borrar mi cuenta» (cancela Paddle, borra R2, vacía correo de cliente Paddle, borra usuario de Auth).
- «Cancelar suscripción» y cambio de plan desde Facturación; aviso de renovación automática, moneda y nota de impuestos junto al pago.
- Formulario del comprador: aviso de privacidad, motivo del WhatsApp y «Recordar mis datos» opcional y desmarcado.
- Se retiraron promesas sin respaldo (Analytics, ERP, API, marca blanca, «24/7», «10 min», «Excel»).
- Accesibilidad: foco visible en botones, contraste corregido, créditos y avisos de licencias.

## Lo que NO se verificó
Navegador (visual, teclado, lector de pantalla), Lighthouse/axe, pestaña Red, Paddle sandbox (cancelar, cambiar plan, precio final con impuestos), Supabase/R2 reales, ejecución de las migraciones 0005 y 0006.

## Preguntas prioritarias para el abogado
1. ¿Qué leyes de datos y consumo aplican según el país de la empresa y los de mayoristas y compradores?
2. **Roles:** el mayorista recoge datos de sus compradores con Catalii. ¿Quién es responsable y quién encargado? ¿Quién da el aviso de privacidad y qué contrato debe aceptar el mayorista?
3. ¿Base legal de cada finalidad (cuenta, pedido, facturación, seguridad, almacenamiento local `catalii-buyer`, carrito, tema)?
4. ¿Se requiere banner o aviso para el almacenamiento local, además de las cookies de sesión? ¿Cambia por país?
5. Plazos de conservación (cuentas, pedidos, compradores, webhooks, logs) y obligaciones de conservar facturas. ¿Qué hacer con los registros de Paddle tras el borrado (Paddle no permite borrar clientes)?
6. Menores: ¿edad mínima o declaración de uso profesional? ¿Qué hacer si un menor envía un pedido por el enlace público?
7. Suscripciones: ¿cumple el flujo (aviso, cancelación, recordatorios) las normas de consumo de los países objetivo? ¿Desistimiento/reembolso por país? ¿Rol de Paddle como vendedor y en impuestos?
8. Precio total: ¿cómo mostrar impuestos por país? (el dueño debe indicar si los precios los incluyen).
9. Transferencias internacionales y DPAs con Supabase, Cloudflare y Paddle; regiones reales (dueño).
10. Contenido de usuarios: canal de reclamos de derechos de autor, régimen aplicable (agente DMCA / DSA) y responsabilidad por catálogos.
11. Licencias: `sharp-libvips` (LGPL-3.0, con componentes MPL-2.0) y `caniuse-lite` (CC-BY-4.0); marcas reales usadas como ejemplo en la maqueta de la landing.

## Evidencias
`docs/legal/INVENTARIO.md`, `docs/legal/DIAGNOSTICO.md` (estado tras Fase 3 al final), `docs/legal/ACCESIBILIDAD.md`, `docs/legal/AUDITORIA_SDKS.md`, `THIRD_PARTY_NOTICES.md`, `CREDITS.md`.
