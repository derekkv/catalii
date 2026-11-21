# Diagramas para Excalidraw

Versión de los diagramas de [`ARQUITECTURA.md`](./ARQUITECTURA.md) preparada
para **Excalidraw**, con color.

## Cómo usarlos

1. Abre [excalidraw.com](https://excalidraw.com).
2. Menú → **Mermaid to Excalidraw** (o pega la definición directamente en el
   lienzo).
3. Copia **un solo bloque** de los de abajo y pégalo.

Salen formas, flechas y texto **editables**, no una imagen.

## Qué se respetó para que funcionen

Excalidraw convierte con `@excalidraw/mermaid-to-excalidraw`, que no soporta
todo Mermaid. Estos diagramas se ajustan a sus reglas:

- Solo **flowchart**, **sequenceDiagram** y **erDiagram**.
- El color va con **`classDef` + `class`**, que es lo que el conversor sí
  traslada. Los estilos aplicados a un `subgraph` **se ignoran**
  ([issue #10720](https://github.com/excalidraw/excalidraw/issues/10720)), así
  que aquí no se usan: el color está siempre en los nodos.
- Solo formas que el conversor conserva: rectángulo, redondeado `(...)`,
  estadio `([...])` y rombo `{...}`. Las demás (hexágono, cilindro) se
  convertirían en rectángulos, así que las bases de datos se marcan con color y
  forma de estadio en lugar de con el cilindro habitual.
- Etiquetas cortas: en una pizarra el texto largo se vuelve ilegible.

> Si un diagrama falla al convertirse, Excalidraw lo inserta como **imagen** en
> vez de como formas. Los ocho de abajo se probaron y generan elementos
> editables.

---

## 1. Visión general

```mermaid
flowchart TB
    mayorista(["Mayorista"])
    comprador(["Comprador"])
    admin(["Administrador"])

    subgraph cf["Cloudflare"]
        worker["Worker Next.js"]
        mediaw["Worker de imagenes"]
        r2(["R2 - 3 buckets"])
    end

    subgraph serv["Servicios"]
        supabase(["Supabase - Postgres Auth RLS"])
        paddle["Paddle - cobros"]
        wa["WhatsApp"]
    end

    subgraph backend["back.catalii.com"]
        express["Backend Express"]
        mongo(["MongoDB Atlas"])
    end

    mayorista --> worker
    comprador --> worker
    admin --> worker
    worker --> supabase
    worker --> paddle
    worker --> r2
    worker -->|"metricas"| express
    comprador -.->|"clic"| wa
    comprador --> mediaw
    mediaw --> r2
    express --> mongo
    express --> supabase
    paddle -->|"webhook firmado"| worker

    classDef persona fill:#e8edf0,stroke:#556370,color:#161d24
    classDef app fill:#1b3a5c,stroke:#101f33,color:#f4f8fb
    classDef datos fill:#1f6b43,stroke:#12402a,color:#ffffff
    classDef externo fill:#b2561b,stroke:#7a3a12,color:#fffaf5
    classDef api fill:#8a5a10,stroke:#5c3c0a,color:#ffffff

    class mayorista,comprador,admin persona
    class worker,mediaw app
    class supabase,mongo,r2 datos
    class paddle,wa externo
    class express api
```

---

## 2. Pedido de un comprador

El flujo central: el único que escribe en la base sin sesión.

```mermaid
sequenceDiagram
    autonumber
    actor C as Comprador
    participant W as Worker Next
    participant DB as Postgres
    participant R as RPC place_order

    C->>W: Abre el catalogo
    W->>DB: Catalogo publico y productos activos
    DB-->>W: Solo lo que RLS permite a anon
    W-->>C: Catalogo con su theme
    Note over C: El carrito vive en el navegador
    C->>W: Envia nombre, WhatsApp y lineas
    W->>R: Llama al RPC como anon
    R->>R: Comprueba que el catalogo sea publico
    R->>R: Limite de frecuencia 60 por hora
    R->>R: Limite mensual del plan
    R->>R: Recalcula cada precio desde la base
    R->>DB: Inserta pedido y lineas en transaccion
    R-->>W: order_id, total y moneda
    W-->>C: Confirmacion
    C-->>C: Puede avisar por WhatsApp
```

---

## 3. Cobro con Paddle

```mermaid
sequenceDiagram
    autonumber
    actor M as Mayorista
    participant W as Worker Next
    participant P as Paddle
    participant DB as Postgres

    M->>W: Abre Facturacion
    W-->>M: Planes y aviso de renovacion
    M->>P: Checkout overlay
    Note over M,P: La tarjeta nunca pasa por la app
    P-->>M: Pago completado
    P->>W: POST api webhook firmado
    W->>W: Verifica la firma con el cuerpo crudo
    W->>DB: Consulta si el evento ya se procreso

    alt Evento repetido
        W-->>P: 200 sin hacer nada
    else Evento nuevo
        W->>DB: Espeja cliente y suscripcion
        W->>DB: Actualiza el plan del negocio
        W->>DB: Registra el id del evento
        W-->>P: 200
    end

    M->>W: Cancelar suscripcion
    W->>P: Cancela al final del periodo
    P->>W: subscription updated
    W->>DB: Guarda la cancelacion programada
```

---

## 4. Métricas en MongoDB

```mermaid
sequenceDiagram
    autonumber
    actor C as Comprador
    participant W as Worker Next
    participant E as Backend Express
    participant S as Supabase
    participant M as MongoDB
    actor A as Administrador

    C->>W: Abre un catalogo
    C-->>W: sendBeacon al endpoint de metrica
    W-->>C: 204 inmediato
    Note over W: El reenvio va en waitUntil
    W->>E: POST eventos de metrica
    E-->>W: 204 siempre
    E->>S: Comprueba si el slug es publico
    S-->>E: ids de negocio y catalogo
    E->>M: Inserta el evento
    Note over M: Sin IP, sin cookies, solo el host del referrer

    A->>W: Abre el panel de metricas
    W->>W: requireAdmin con el correo verificado
    W->>E: GET resumen con el token del admin
    E->>S: Revalida el token y que sea admin
    E->>M: Pipeline de agregacion
    M-->>E: Totales, serie, por negocio y pais
    E-->>W: Resultado
    W-->>A: Panel
    Note over M: Un indice TTL borra lo viejo solo
```

---

## 5. Modelo de datos en PostgreSQL

```mermaid
erDiagram
    USUARIO ||--|| NEGOCIO : "es dueno de"
    NEGOCIO ||--o{ PRODUCTO : tiene
    NEGOCIO ||--o{ CATALOGO : tiene
    NEGOCIO ||--o{ PEDIDO : recibe
    CATALOGO ||--o{ CATALOGO_PRODUCTO : incluye
    PRODUCTO ||--o{ CATALOGO_PRODUCTO : "aparece en"
    PEDIDO ||--|{ LINEA_PEDIDO : contiene
    PRODUCTO |o--o{ LINEA_PEDIDO : "se pidio como"
    CATALOGO |o--o{ PEDIDO : "llego por"
    NEGOCIO |o--o| CLIENTE_PADDLE : "enlaza por correo"
    CLIENTE_PADDLE ||--o{ SUSCRIPCION : tiene
    USUARIO ||--o{ ACEPTACION_LEGAL : acepto

    NEGOCIO {
        uuid id PK
        uuid owner_id FK
        text slug UK "su enlace publico"
        text email "no visible a anon"
        enum plan "free starter pro business"
        boolean is_public "publica su pagina"
    }
    PRODUCTO {
        uuid id PK
        integer price_cents "siempre en centavos"
        integer stock
        integer min_order_qty
        jsonb images "claves de R2"
        boolean active
    }
    CATALOGO {
        uuid id PK
        text slug UK
        boolean is_public
        text theme "hereda del negocio"
    }
    PEDIDO {
        uuid id PK
        text customer_name "del comprador"
        text customer_whatsapp
        integer total_cents "lo calcula el RPC"
        enum status "pending confirmed shipped cancelled"
    }
    LINEA_PEDIDO {
        uuid id PK
        integer quantity
        integer unit_price_cents "congelado al pedir"
    }
    ACEPTACION_LEGAL {
        uuid user_id FK
        text document "terms o privacy"
        text version
        timestamptz accepted_at "UTC, inmutable"
    }

    classDef cuenta fill:#e8edf0,stroke:#556370,color:#161d24
    classDef nucleo fill:#1b3a5c,stroke:#101f33,color:#f4f8fb
    classDef contenido fill:#1f6b43,stroke:#12402a,color:#ffffff
    classDef entrante fill:#b2561b,stroke:#7a3a12,color:#fffaf5
    classDef pagos fill:#8a5a10,stroke:#5c3c0a,color:#ffffff

    class USUARIO,ACEPTACION_LEGAL cuenta
    class NEGOCIO nucleo
    class PRODUCTO,CATALOGO,CATALOGO_PRODUCTO contenido
    class PEDIDO,LINEA_PEDIDO entrante
    class CLIENTE_PADDLE,SUSCRIPCION pagos
```

Los colores separan de un vistazo lo que es **del mayorista** (verde), lo que
**entra de fuera** (terracota, los pedidos de compradores anónimos), lo que
toca **dinero** (dorado) y lo que es **de la cuenta** (gris).

---

## 6. Colección de MongoDB

```mermaid
erDiagram
    EVENTO {
        ObjectId _id PK
        string kind "business_view catalog_view whatsapp_click"
        string businessId "uuid de Postgres"
        string businessSlug
        string catalogId "nulo en vistas de negocio"
        string catalogSlug
        date at "indice TTL"
        string country "de la cabecera CF-IPCountry"
        string referrerHost "solo el host"
        string device "mobile o desktop"
    }

    classDef analitica fill:#1f6b43,stroke:#12402a,color:#ffffff
    class EVENTO analitica
```

Sin relaciones porque son eventos independientes: el cruce con Postgres se hace
por `businessId` al consultar.

---

## 7. Seguridad por capas

```mermaid
flowchart TB
    req(["Peticion"])
    cab["Cabeceras HSTS nosniff CSP"]
    mid["Middleware - sesion y rutas protegidas"]
    ruta{"Que ruta"}

    anon["Cliente anonimo - RLS solo publicado"]
    auth["Cliente del usuario - RLS por propiedad"]
    adm["requireAdmin - correo verificado"]
    sig["Firma de Paddle"]

    rpc["Solo escribe el RPC - recalcula precios"]
    own["Predicados de propiedad"]
    svc["service_role solo tras autorizar"]
    idem["Idempotencia por ledger"]

    db(["Postgres"])

    req --> cab --> mid --> ruta
    ruta -->|"publica"| anon
    ruta -->|"panel"| auth
    ruta -->|"admin"| adm
    ruta -->|"webhook"| sig
    anon --> rpc
    auth --> own
    adm --> svc
    sig --> idem
    rpc --> db
    own --> db
    svc --> db
    idem --> db

    classDef entrada fill:#e8edf0,stroke:#556370,color:#161d24
    classDef barrera fill:#1b3a5c,stroke:#101f33,color:#f4f8fb
    classDef control fill:#8a5a10,stroke:#5c3c0a,color:#ffffff
    classDef dato fill:#1f6b43,stroke:#12402a,color:#ffffff
    classDef decision fill:#b2561b,stroke:#7a3a12,color:#fffaf5

    class req entrada
    class cab,mid,anon,auth,adm,sig barrera
    class ruta decision
    class rpc,own,svc,idem control
    class db dato
```

---

## 8. Despliegue

```mermaid
flowchart LR
    push(["git push a main"])
    build["Workers Builds - pnpm cf cfbuild"]
    onext["OpenNext genera el worker"]
    prod["Worker en produccion"]
    dom1(["catalii.com"])

    mediaw["Worker de imagenes"]
    dom2(["media.catalii.com"])

    docker["Dockerfile del backend"]
    host["Host Node"]
    dom3(["back.catalii.com"])

    sup(["Supabase - migraciones 0001 a 0010"])
    atlas(["MongoDB Atlas - indices y TTL"])

    push --> build --> onext --> prod --> dom1
    mediaw --> dom2
    docker --> host --> dom3
    prod --> sup
    host --> atlas
    host --> sup

    classDef paso fill:#1b3a5c,stroke:#101f33,color:#f4f8fb
    classDef dominio fill:#e8edf0,stroke:#556370,color:#161d24
    classDef pendiente fill:#b2561b,stroke:#7a3a12,color:#fffaf5
    classDef dato fill:#1f6b43,stroke:#12402a,color:#ffffff

    class build,onext,prod,mediaw paso
    class push,dom1,dom2,dom3 dominio
    class docker,host pendiente
    class sup,atlas dato
```

En naranja, lo que **todavía no está desplegado**: el backend Express. El Worker
de imágenes tampoco tiene dominio conectado.

---

## 9. Mapa de rutas

```mermaid
flowchart TB
    subgraph pub["Publico"]
        home["Landing"]
        cat["Catalogo - c slug"]
        neg["Negocio - n slug"]
        leg["Privacidad y terminos"]
        log["Login"]
    end

    subgraph pan["Panel del mayorista"]
        dash["Resumen"]
        prod["Productos"]
        cats["Catalogos"]
        peds["Pedidos"]
        fact["Facturacion"]
        conf["Ajustes"]
    end

    subgraph adm["Panel del SaaS"]
        a1["Resumen"]
        a2["Negocios"]
        a3["Suscripciones"]
        a4["Pedidos"]
        a5["Metricas"]
    end

    home --> log --> dash
    dash --> prod
    dash --> cats
    dash --> peds
    dash --> fact
    dash --> conf
    cats -->|"publica"| cat
    conf -->|"publica"| neg
    neg <--> cat

    classDef publico fill:#1f6b43,stroke:#12402a,color:#ffffff
    classDef panel fill:#1b3a5c,stroke:#101f33,color:#f4f8fb
    classDef admin fill:#8a5a10,stroke:#5c3c0a,color:#ffffff

    class home,cat,neg,leg,log publico
    class dash,prod,cats,peds,fact,conf panel
    class a1,a2,a3,a4,a5 admin
```

---

## 10. Alta de un mayorista

```mermaid
sequenceDiagram
    autonumber
    actor M as Mayorista
    participant W as Worker Next
    participant A as Supabase Auth
    participant DB as Postgres

    M->>W: Rellena el registro y acepta los terminos
    W->>W: Valida y exige la casilla
    W->>A: Crea la cuenta
    A-->>M: Correo de confirmacion
    W->>DB: Guarda la aceptacion con version y fecha
    Note over W,DB: Si falla, el alta sigue y queda en los logs
    M->>W: Confirma el enlace del correo
    W->>A: Verifica el token
    W-->>M: Lleva al onboarding
    M->>W: Datos del negocio
    W->>DB: Inserta el negocio con su dueno
    Note over DB: La pagina del negocio nace despublicada
    W-->>M: Panel
```

---

## 11. Subida de imágenes

```mermaid
sequenceDiagram
    autonumber
    actor M as Mayorista
    participant B as Navegador
    participant W as Worker Next
    participant R as R2
    participant DB as Postgres
    actor C as Comprador

    M->>B: Elige una foto
    B->>B: Comprime a WebP y hace miniatura
    B->>W: Sube el archivo
    W->>W: Verifica sesion, bytes, peso y medidas
    W->>R: Guarda imagen y miniatura
    W-->>B: Devuelve la clave
    B->>W: Guarda el producto con esa clave
    W->>DB: Guarda la clave, nunca la URL
    C->>R: Pide la imagen por su URL
    R-->>C: Foto con cache de un ano
```
