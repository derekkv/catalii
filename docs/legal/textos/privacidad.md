# Privacidad

Versión: 2026-11-21 (rev3) · Página: `/privacidad`

Qué datos guarda Catalii, dónde quedan y cómo borrarlos.

> Generado desde `src/lib/legal/content.ts` con `pnpm legal:export`. No lo edites a mano.

> **Catalii es un proyecto escolar en desarrollo, no un servicio comercial.**
> **Los planes de pago y el checkout están en modo de pruebas: no se cobra dinero real.**
> **No subas datos reales de clientes ni información que no quieras compartir.**

> Pendiente: 5 dato(s) `[COMPLETAR]`.

## 1. Quién está detrás

Catalii es un proyecto escolar hecho por [COMPLETAR] para [COMPLETAR]. Sirve para que un mayorista publique un catálogo con enlace propio y reciba pedidos.

Para cualquier cosa sobre tus datos, escribe a [COMPLETAR].

## 2. Qué datos se guardan

Si creas una cuenta (vendedor):

- Correo y contraseña. La contraseña la gestiona el servicio de autenticación; no se ve en claro.
- Nombre, si lo escribes (opcional).
- Datos del negocio: nombre, enlace público, apariencia, WhatsApp y correo de contacto (opcionales).
- Lo que subes o creas: logo, banner, fotos, productos, precios y catálogos.
- Datos de suscripción de prueba: identificadores, estado y plan. Los datos de tarjeta los recoge Paddle; aquí no se guardan.

Si envías un pedido desde un catálogo (comprador):

- Nombre y número de WhatsApp (obligatorios para enviar el pedido).
- Correo, si lo escribes (opcional).
- Notas del pedido: es texto libre, así que no escribas ahí nada que no quieras compartir.
- Las líneas del pedido: productos, cantidades y precios.

## 3. Para qué se usan

- Crear tu cuenta, iniciar sesión y recuperar la contraseña.
- Mostrar los catálogos públicos y guardar los pedidos que reciben.
- Que el vendedor pueda responder al comprador sobre su pedido.
- Gestionar la suscripción de prueba de los planes de pago.

No hay publicidad, ni píxeles de terceros, y los datos no se venden a nadie. Sí se cuentan visitas a las páginas públicas, pero de forma anónima: ver el punto 6.

## 4. Qué queda en tu navegador

- Cookie de sesión (empieza por sb-…-auth-token): mantiene tu sesión si has iniciado sesión.
- catalii-theme: recuerda la apariencia que elegiste.
- catalii-cart:<catálogo>: conserva el carrito en ese dispositivo.
- catalii-buyer: guarda nombre, teléfono y correo del comprador solo si marca «Recordar mis datos en este dispositivo». Si no la marca, no se guarda y se borra lo que hubiera.
- catalii-dev-notice-dismissed: recuerda que cerraste el aviso de desarrollo.

Todo eso se queda en tu dispositivo y puedes borrarlo desde la configuración de tu navegador.

## 5. Servicios de terceros que se usan

- Supabase: base de datos y cuentas (ahí viven negocios, productos, catálogos y pedidos).
- Cloudflare: aloja la aplicación y guarda las imágenes que se suben. Las imágenes son públicas por su enlace.
- Paddle: checkout y suscripciones, en modo de pruebas.
- Google (Gemini): solo si el vendedor importa un archivo de productos. Ver el punto 7.

WhatsApp solo interviene si alguien pulsa el enlace para avisar por WhatsApp: el mensaje lo envía esa persona desde su propia cuenta.

## 6. Contador de visitas

Cuando alguien abre la página de un negocio o un catálogo se guarda un registro de esa visita para que el vendedor y el administrador vean cuántas hubo.

De cada visita se guarda:

- Qué se vio (negocio o catálogo) y cuándo.
- El país, que lo deduce el hosting de la conexión.
- Si el enlace venía de otro sitio web, solo el nombre de ese sitio, nunca la dirección completa.
- Si el dispositivo es móvil o de escritorio.

No se guarda la dirección IP, ni el navegador concreto, ni ninguna cookie o identificador que permita seguir a una misma persona entre visitas: por eso el contador dice visitas y no personas. Los registros se borran solos a los 180 días.

## 7. Ayuda de IA al importar productos

Al importar un archivo de productos (Excel o CSV), el vendedor puede pedir ayuda para adivinar qué columna es el nombre, qué columna es el precio y así con el resto. Esa parte la propone Gemini, de Google.

Qué se envía a Google en ese momento:

- Los nombres de las columnas del archivo.
- Hasta cinco filas de ejemplo, recortadas a 120 caracteres por celda.

No se envía el archivo completo, ni su nombre, ni nada de la cuenta, el negocio o los pedidos. La IA solo dice a qué campo corresponde cada columna; no cambia ni rellena ningún dato, y el vendedor confirma la correspondencia antes de que se guarde nada.

Es opcional: si no hay clave de Google configurada o la petición falla, la importación sigue funcionando adivinando las columnas por su nombre, sin salir de Catalii. Un archivo con datos de personas (clientes, proveedores) no debería importarse como lista de productos.

Según los términos de la API de Gemini, en el nivel gratuito Google puede usar lo enviado para mejorar sus productos y revisores humanos pueden llegar a leerlo; en el nivel de pago, no. Esta versión usa el nivel configurado por quien despliega la aplicación, y por eso en las filas de ejemplo no debe haber nada confidencial.

## 8. Quién puede ver un pedido

El vendedor dueño del catálogo ve los pedidos de su catálogo y solo los suyos: la base de datos lo limita por cuenta.

Si eres comprador y quieres que se corrija o se retire tu pedido, pídeselo al vendedor, que es quien lo gestiona, o escribe a [COMPLETAR].

## 9. Descargar o borrar tus datos

- En Configuración, dentro del panel, puedes descargar tus datos en un archivo JSON.
- En esa misma pantalla puedes borrar tu cuenta: se eliminan negocio, productos, catálogos, pedidos e imágenes, y se cancela la suscripción de prueba. Es permanente.
- Si no puedes entrar a tu cuenta, escribe a [COMPLETAR].

## 10. Seguridad y cambios

Las conexiones van cifradas y la base de datos restringe el acceso para que cada cuenta vea solo sus datos. Aun así es un proyecto en desarrollo: no se puede prometer seguridad absoluta.

Si este texto cambia, la nueva versión se publica en esta misma página con su fecha.
