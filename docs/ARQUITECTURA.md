# Arquitectura de Catalii

Diagramas del sistema tal como está hoy, no como se planeó. Donde algo está a
medias o en pausa, se dice.

Los diagramas son [Mermaid](https://mermaid.js.org/): GitHub, GitLab y VS Code
los dibujan solos al abrir este archivo.

---

## 1. Visión general

Tres piezas desplegadas por separado, y una base de datos como fuente de verdad.

```mermaid
flowchart TB
    subgraph clientes["Quién usa la app"]
        mayorista["Mayorista<br/>con cuenta"]
        comprador["Comprador<br/>sin cuenta"]
        admin["Administrador<br/>del SaaS"]
    end

    subgraph cloudflare["Cloudflare"]
        worker["Worker principal<br/>Next.js 16 vía OpenNext"]
        mediaw["Worker de imágenes<br/>sirve las fotos"]
        r2[("R2<br/>3 buckets")]
    end

    subgraph externo["Servicios"]
        supabase[("Supabase<br/>Postgres + Auth + RLS")]
        paddle["Paddle<br/>cobros"]
        whatsapp["WhatsApp<br/>enlace wa.me"]
    end

    subgraph back["back.catalii.com"]
        express["Backend Express<br/>Node 20"]
        mongo[("MongoDB Atlas<br/>eventos")]
    end

    mayorista --> worker
    comprador --> worker
    admin --> worker

    worker --> supabase
    worker --> paddle
    worker --> r2
    worker -->|"eventos de métrica"| express
    worker -->|"lee métricas"| express

    comprador -.->|"pulsa el enlace"| whatsapp
    comprador --> mediaw
    mediaw --> r2

    express --> mongo
    express --> supabase
    paddle -->|"webhook firmado"| worker
```

**Por qué Mongo vive en el backend y no en el Worker:** el driver funciona en
Workers, pero [Cloudflare advierte](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/)
que cada invocación abre una conexión TCP y TLS nueva, unos 300 ms, y
Hyperdrive no soporta Mongo. El backend es Node, mantiene un pool y no paga ese
coste.

---

## 2. Tecnologías

```mermaid
flowchart LR
    subgraph front["Front"]
        n["Next.js 16<br/>App Router"]
        r["React 19"]
        t["Tailwind CSS 4<br/>5 themes"]
        z1["Zod<br/>validación"]
    end

    subgraph runtime["Ejecución"]
        on["OpenNext<br/>adaptador"]
        wd["workerd<br/>runtime de Workers"]
    end

    subgraph datos["Datos"]
        pg[("PostgreSQL<br/>con RLS")]
        mg[("MongoDB<br/>analítica")]
        ob[("R2<br/>objetos")]
    end

    subgraph servicios["Integraciones"]
        au["Supabase Auth<br/>correo y contraseña"]
        pd["Paddle<br/>suscripciones"]
    end

    subgraph api["Backend"]
        ex["Express 4"]
        md["Driver mongodb"]
        z2["Zod"]
    end

    n --> r
    n --> t
    n --> z1
    n --> on
    on --> wd
    n --> pg
    n --> au
    n --> pd
    n --> ob
    n --> ex
    ex --> md
    md --> mg
    ex --> z2
    ex --> pg
```

| Capa | Qué se usa | Por qué |
|---|---|---|
| Interfaz | Next.js 16 (App Router), React 19, Tailwind 4 | Renderizado en servidor y Server Actions, sin API propia para el panel |
| Datos transaccionales | PostgreSQL en Supabase, con RLS en todas las tablas | Relaciones, transacciones y aislamiento por negocio en la propia base |
| Analítica | MongoDB Atlas | Eventos append-only de forma variable, agregaciones y retención por TTL |
| Imágenes | Cloudflare R2 + Worker aparte | Servir fotos sin pasar por el runtime de la app |
| Autenticación | Supabase Auth (correo y contraseña) | Sesión en cookie, verificada en el servidor en cada petición |
| Cobros | Paddle (merchant of record) | Suscripciones e impuestos sin tocar datos de tarjeta |
| Validación | Zod, en front y backend | El mismo contrato en las dos capas |
| Despliegue | Cloudflare Workers (app), Docker (backend) | — |

---

## 3. Mapa de rutas

```mermaid
flowchart TB
    subgraph publico["Público, sin sesión"]
        home["/<br/>landing"]
        cat["/c/:slug<br/>catálogo y pedido"]
        neg["/n/:slug<br/>página del negocio"]
        legal["/privacidad · /terminos<br/>/contacto"]
        login["/login · /auth/reset"]
    end

    subgraph panel["Panel del mayorista, requiere sesión"]
        dash["/dashboard"]
        onb["/dashboard/onboarding"]
        prod["/dashboard/productos"]
        cats["/dashboard/catalogos"]
        peds["/dashboard/pedidos"]
        fact["/dashboard/facturacion"]
        conf["/dashboard/configuracion"]
    end

    subgraph adm["Panel del SaaS, solo ADMIN_EMAILS"]
        a1["/admin"]
        a2["/admin/negocios"]
        a3["/admin/suscripciones"]
        a4["/admin/pedidos"]
        a5["/admin/metricas"]
    end

    subgraph apis["Route handlers"]
        up["/api/uploads<br/>sube a R2"]
        me["/api/media/*<br/>sirve imágenes"]
        wh["/api/webhook<br/>Paddle"]
        mt["/api/metric<br/>reenvía al backend"]
        ex["/api/account/export<br/>descarga tus datos"]
    end

    home --> login
    login --> dash
    dash --> onb
    neg --> cat
    cat --> neg
    conf -->|"publica"| neg
    cats -->|"publica"| cat
```

Todas las rutas se renderizan por petición. La Content-Security-Policy usa un
nonce distinto en cada visita, y eso obliga a leer cabeceras en el layout, así
que no queda HTML prerenderizado. Fue un cambio consciente: seguridad a cambio
de algo de CPU por visita.

---

## 4. Alta de un mayorista

```mermaid
sequenceDiagram
    actor M as Mayorista
    participant W as Worker (Next)
    participant A as Supabase Auth
    participant DB as Postgres

    M->>W: Rellena el registro y marca la casilla de términos
    W->>W: Valida con Zod y exige la casilla
    W->>A: signUp con correo y contraseña
    A-->>M: Correo de confirmación
    W->>DB: Guarda la aceptación (documento, versión, fecha UTC)
    Note over W,DB: Si esto falla, el alta sigue y queda en los logs

    M->>W: Confirma el enlace del correo
    W->>A: Verifica el token
    W->>M: Redirige al onboarding

    M->>W: Datos del negocio (nombre obligatorio, resto opcional)
    W->>DB: Inserta en business con owner_id del usuario
    Note over DB: La página del negocio nace despublicada
    W->>M: Panel
```

---

## 5. Pedido de un comprador

El flujo más importante, y el único que escribe sin sesión.

```mermaid
sequenceDiagram
    actor C as Comprador
    participant W as Worker (Next)
    participant DB as Postgres
    participant RPC as place_order

    C->>W: Abre /c/:slug
    W->>DB: Catálogo público y sus productos activos
    DB-->>W: Solo lo que RLS permite a anon
    W-->>C: Catálogo con su theme

    C->>C: Arma el carrito (vive en el navegador)
    C->>W: Envía nombre, WhatsApp y las líneas
    W->>W: Valida con Zod
    W->>RPC: Llama al RPC como anon

    RPC->>RPC: 1. Comprueba que el catálogo sea público
    RPC->>RPC: 2. Límite de frecuencia (60 por hora, 5 por teléfono)
    RPC->>RPC: 3. Límite mensual del plan del negocio
    RPC->>RPC: 4. Recalcula cada precio desde la base
    RPC->>DB: Inserta pedido y líneas en una transacción
    RPC-->>W: order_id, total y moneda

    W-->>C: Confirmación
    C-.->C: Puede avisar al mayorista por WhatsApp
```

**El cliente nunca fija el precio.** El RPC lo recalcula desde la base, así que
manipular el carrito en el navegador no cambia el importe. Y es
`security definer`, la única vía por la que `anon` puede escribir.

---

## 6. Suscripción y cobro

```mermaid
sequenceDiagram
    actor M as Mayorista
    participant W as Worker (Next)
    participant P as Paddle
    participant DB as Postgres

    M->>W: Abre Facturación
    W-->>M: Planes, aviso de renovación y moneda
    M->>P: Checkout (overlay de Paddle)
    Note over M,P: Los datos de tarjeta nunca pasan por la app

    P-->>M: Pago completado
    P->>W: POST /api/webhook (firmado)
    W->>W: Verifica la firma con el cuerpo crudo
    W->>DB: ¿Evento ya procesado?
    alt Repetido
        W-->>P: 200 sin hacer nada
    else Nuevo
        W->>DB: Espeja cliente y suscripción
        W->>DB: Actualiza el plan del negocio
        W->>DB: Registra el id del evento
        W-->>P: 200
    end

    M->>W: Cancelar suscripción
    W->>P: subscriptions.cancel al final del periodo
    P->>W: subscription.updated
    W->>DB: Guarda la cancelación programada
```

El enlace entre Paddle y el negocio se hace **por correo electrónico**. Si el
correo de Paddle no coincide con el del negocio, el pago se registra pero el
plan no se aplica; eso queda en los logs del webhook.

---

## 7. Imágenes

```mermaid
sequenceDiagram
    actor M as Mayorista
    participant B as Navegador
    participant W as Worker (Next)
    participant R2 as R2
    participant DB as Postgres
    actor C as Comprador

    M->>B: Elige una foto
    B->>B: Comprime a WebP y genera miniatura
    B->>W: POST /api/uploads
    W->>W: Verifica sesión, firma de bytes, tamaño y dimensiones
    W->>R2: Guarda la imagen y su miniatura
    W-->>B: Devuelve la clave
    B->>W: Guarda el producto con esa clave
    W->>DB: Guarda solo la clave, nunca la URL

    C->>+R2: Pide la imagen por su URL pública
    R2-->>-C: Foto con caché de un año
```

En la base se guarda **la clave**, no la URL. Así cambiar de dominio de
imágenes no obliga a migrar datos.

---

## 8. Métricas en MongoDB

```mermaid
sequenceDiagram
    actor C as Comprador
    participant W as Worker (Next)
    participant E as Backend Express
    participant S as Supabase
    participant MG as MongoDB
    actor A as Administrador

    C->>W: Abre un catálogo
    C-->>W: sendBeacon a /api/metric
    W-->>C: 204 inmediato
    Note over W: El reenvío va en waitUntil, no bloquea

    W->>E: POST /api/metrics/events
    E-->>W: 204 siempre
    E->>S: ¿El slug es público? (con caché en memoria)
    S-->>E: ids del negocio y del catálogo
    E->>MG: Inserta el evento
    Note over MG: Sin IP, sin user agent, sin cookies<br/>Del referrer solo el host

    A->>W: Abre /admin/metricas
    W->>W: requireAdmin con el correo verificado
    W->>E: GET /api/metrics/summary con el token del admin
    E->>S: Revalida el token y comprueba que sea admin
    E->>MG: Pipeline de agregación
    MG-->>E: Totales, serie por día, por negocio y por país
    E-->>W: Resultado
    W-->>A: Panel

    Note over MG: Un índice TTL borra los eventos viejos solo
```

Si Mongo o el backend no responden, el panel dice que las métricas no están
disponibles **en lugar de pintar ceros**, que se leerían como "nadie visitó".
Y un fallo ahí no afecta a pedidos ni a pagos.

---

## 9. Modelo de datos

### PostgreSQL (fuente de verdad)

```mermaid
erDiagram
    users ||--|| business : "es dueño de"
    business ||--o{ product : tiene
    business ||--o{ catalog : tiene
    business ||--o{ order : recibe
    business ||--o{ price_list : "tiene (sin uso)"
    business ||--o{ customer : "tiene (sin uso)"
    catalog ||--o{ catalog_product : incluye
    product ||--o{ catalog_product : "aparece en"
    order ||--|{ order_item : contiene
    product |o--o{ order_item : "se pidió como"
    catalog |o--o{ order : "llegó por"
    business |o--o| paddle_customer : "enlaza por correo"
    paddle_customer ||--o{ paddle_subscription : tiene
    users ||--o{ legal_acceptance : aceptó

    business {
        uuid id PK
        uuid owner_id FK
        text name
        text slug UK
        text email "no público"
        enum plan "free starter pro business"
        boolean is_public "publica /n/slug"
        text tagline_description_category "perfil"
        text whatsapp_phone_address_hours "contacto"
    }
    product {
        uuid id PK
        text name
        integer price_cents
        integer stock
        integer min_order_qty
        jsonb images "claves de R2"
        boolean active
    }
    catalog {
        uuid id PK
        text slug UK
        boolean is_public
        text theme "hereda del negocio"
    }
    order {
        uuid id PK
        text customer_name "del comprador"
        text customer_whatsapp
        integer total_cents "lo calcula el RPC"
        enum status "pending confirmed shipped cancelled"
    }
    legal_acceptance {
        uuid user_id FK
        text document "terms privacy"
        text version
        timestamptz accepted_at "UTC, inmutable"
    }
```

Tablas de apoyo: `processed_webhook` (idempotencia de Paddle, con purga a 90
días). `price_list` y `customer` existen desde el inicio y **ningún código las
usa**.

### MongoDB (analítica)

```mermaid
erDiagram
    events {
        ObjectId _id PK
        string kind "business_view catalog_view whatsapp_click"
        string businessId "uuid de Postgres"
        string businessSlug
        string catalogId "nulo en vistas de negocio"
        string catalogSlug
        date at "índice TTL"
        string country "de CF-IPCountry"
        string referrerHost "solo el host"
        string device "mobile o desktop"
    }
```

No hay relaciones porque no hay nada que relacionar: son eventos
independientes. El cruce con Postgres se hace por `businessId` al consultar.

---

## 10. Seguridad por capas

```mermaid
flowchart TB
    v["Petición"] --> csp["Cabeceras<br/>HSTS, nosniff, CSP en Report-Only"]
    csp --> mw["Middleware<br/>refresca sesión, protege /dashboard y /admin"]
    mw --> rt{"¿Qué ruta?"}

    rt -->|"pública"| anon["Cliente anónimo<br/>RLS: solo lo publicado"]
    rt -->|"panel"| auth["Cliente del usuario<br/>RLS: owner_id = auth.uid()"]
    rt -->|"/admin"| adm["requireAdmin<br/>correo verificado contra ADMIN_EMAILS"]
    rt -->|"webhook"| sig["Firma de Paddle<br/>con el cuerpo crudo"]

    anon --> rpc["Escritura solo por RPC<br/>place_order recalcula precios"]
    auth --> own["Predicados de propiedad<br/>en cada política"]
    adm --> svc["Cliente service_role<br/>solo tras autorizar, server-only"]
    sig --> idem["Idempotencia<br/>ledger de eventos"]

    rpc --> db[("Postgres")]
    own --> db
    svc --> db
    idem --> db
```

Lo que conviene tener presente:

- **RLS en todas las tablas**, con predicados de propiedad, no solo
  `TO authenticated`.
- El `service_role` está marcado `server-only` y solo se usa en el webhook, el
  borrado de cuenta, el registro de aceptaciones y el panel de administración,
  siempre **después** de autorizar.
- La **CSP va en Report-Only**: hoy informa pero no bloquea. Pasa a bloqueo con
  `CSP_MODE=enforce`, y antes hay que confirmar los dominios del checkout de
  Paddle (tareas #51 y #18 de `PENDIENTES.md`).
- A quien no es administrador se le responde **404 y no 403**, para no
  confirmar que `/admin` existe.

---

## 11. Despliegue

```mermaid
flowchart LR
    git["git push a main"] --> cfb["Cloudflare Workers Builds"]
    cfb -->|"pnpm cf:build"| onb["OpenNext genera<br/>.open-next/worker.js"]
    onb --> dep["Worker en producción"]

    dep --- dom1["catalii.com"]
    mw2["Worker de imágenes<br/>pnpm media:deploy"] --- dom2["media.catalii.com"]
    doc["Dockerfile<br/>backend/"] --> host["Host Node"]
    host --- dom3["back.catalii.com"]

    sup["Supabase"] --- mig["Migraciones 0001 a 0010"]
    atl["MongoDB Atlas"] --- idx["Índices y TTL<br/>al arrancar el backend"]
```

| Pieza | Estado |
|---|---|
| Worker principal | Despliega desde Git en cada push |
| Migraciones | `0001`–`0009` aplicadas · **`0010` pendiente** |
| Backend Express | Dockerfile listo, **sin desplegar** |
| MongoDB Atlas | Cluster en creación |
| Worker de imágenes | Sin dominio conectado |

Las variables `NEXT_PUBLIC_*` se incrustan **en el build**; los secretos
(`SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_API_KEY`,
`PADDLE_NOTIFICATION_WEBHOOK_SECRET`, `ADMIN_EMAILS`) son secretos del Worker.
El backend necesita además `MONGODB_URI`.

---

## 12. Lo que está a medias

Para que el diagrama no engañe:

- **El backend solo se usa para métricas.** Tiene endpoints de productos,
  catálogos y pedidos, y el front sabe llamarlos, pero esa migración está en
  pausa (tarea #25). Con `BACKEND_URL` vacía, todo va directo a Supabase.
- **La CSP no bloquea todavía** (#51).
- **`price_list` y `customer`** son tablas sin usar (#33).
- **Sin tests ni CI** (#50).

El detalle de cada punto está en [`PENDIENTES.md`](../PENDIENTES.md).
