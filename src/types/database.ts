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
  created_at: string;
  updated_at: string;
}

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
