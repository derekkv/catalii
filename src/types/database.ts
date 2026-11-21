export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";
export type PlanTier = "free" | "starter" | "pro" | "business";

export interface StoredImage {
  key: string;
  w: number;
  h: number;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_key: string | null;
  banner_key: string | null;
  whatsapp: string | null;
  email: string | null;
  theme: string;
  plan: PlanTier;
  // Perfil público del negocio (migración 0009). Todo opcional: el dueño
  // rellena lo que quiera y la página se adapta a lo que haya.
  tagline: string | null;
  description: string | null;
  category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  /** Solo el usuario, sin arroba ni URL. */
  instagram: string | null;
  /** Solo el usuario o el nombre de la página. */
  facebook: string | null;
  hours: string | null;
  /** Si la página pública del negocio está publicada. */
  is_public: boolean;
  /** Si esa página lista además todos los productos visibles. */
  show_products: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Campos del negocio que se pueden leer sin sesión.
 *
 * Coincide con el `grant select (...)` de la migración 0009: `email`, `plan` y
 * `owner_id` no están, y pedirlos como `anon` falla por permisos.
 */
export type PublicBusiness = Pick<
  Business,
  | "id"
  | "name"
  | "slug"
  | "tagline"
  | "description"
  | "category"
  | "whatsapp"
  | "phone"
  | "address"
  | "city"
  | "country"
  | "website"
  | "instagram"
  | "facebook"
  | "hours"
  | "theme"
  | "logo_url"
  | "logo_key"
  | "banner_key"
  | "is_public"
  | "show_products"
  | "created_at"
>;

/** Columnas públicas del negocio, para usar en `.select()`. */
export const PUBLIC_BUSINESS_COLUMNS =
  "id, name, slug, tagline, description, category, whatsapp, phone, address, city, country, website, instagram, facebook, hours, theme, logo_url, logo_key, banner_key, is_public, show_products, created_at";

/*
 * Las métricas ya no están en Postgres. La migración `0010` borró la tabla de
 * contadores, su enum y su RPC: las visitas y los clics son documentos en
 * MongoDB que sirve el backend. Sus tipos viven en
 * `src/lib/metrics/types.ts`, porque este archivo describe el esquema de
 * Supabase y aquello ya no forma parte de él.
 */

export interface Product {
  id: string;
  business_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  min_order_qty: number;
  /** URL externa (CSV / legado). Se usa solo si `images` está vacío. */
  image_url: string | null;
  /** Hasta 3 imágenes subidas; la primera es la principal. */
  images: StoredImage[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Catalog {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
  logo_key: string | null;
  banner_key: string | null;
  whatsapp: string | null;
  theme: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  catalog_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface PaddleSubscription {
  subscription_id: string;
  customer_id: string;
  business_id: string | null;
  status: string;
  price_id: string | null;
  product_id: string | null;
  scheduled_change_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LegalAcceptanceDocument = "terms" | "privacy";
export type LegalAcceptanceMethod = "signup_checkbox" | "reaccept_prompt";

/** Fila de `legal_acceptance` (inmutable; ver supabase/migrations/0005). */
export interface LegalAcceptance {
  id: string;
  user_id: string;
  document: LegalAcceptanceDocument;
  version: string;
  accepted_at: string;
  method: LegalAcceptanceMethod;
}
