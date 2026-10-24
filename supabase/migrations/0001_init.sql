create type order_status as enum ('pending', 'confirmed', 'shipped', 'cancelled');
create type plan_tier as enum ('free', 'starter', 'pro', 'business');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table business (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  logo_url      text,
  whatsapp      text check (whatsapp is null or char_length(whatsapp) <= 25),
  email         text check (email is null or char_length(email) <= 160),
  theme         text not null default 'vibrant',
  plan          plan_tier not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index business_owner_idx on business (owner_id);

create trigger business_set_updated_at
  before update on business
  for each row execute function set_updated_at();

create table product (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references business (id) on delete cascade,
  sku            text check (sku is null or char_length(sku) <= 60),
  name           text not null check (char_length(name) between 1 and 200),
  description    text check (description is null or char_length(description) <= 2000),
  category       text check (category is null or char_length(category) <= 80),
  price_cents    integer not null default 0 check (price_cents >= 0),
  currency       text not null default 'USD' check (char_length(currency) = 3),
  stock          integer not null default 0,
  min_order_qty  integer not null default 1 check (min_order_qty >= 1),
  image_url      text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index product_business_idx on product (business_id);
create index product_business_active_idx on product (business_id, active);
create index product_category_idx on product (business_id, category);

create trigger product_set_updated_at
  before update on product
  for each row execute function set_updated_at();

create table catalog (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references business (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  slug           text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  description    text check (description is null or char_length(description) <= 500),
  -- Branding público (seguro de exponer a anon):
  display_name   text check (display_name is null or char_length(display_name) <= 120),
  logo_url       text,
  banner_url     text,
  whatsapp       text check (whatsapp is null or char_length(whatsapp) <= 25),
  theme          text, -- si es null, hereda el theme del business
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index catalog_business_idx on catalog (business_id);
create index catalog_public_idx on catalog (is_public) where is_public;

create trigger catalog_set_updated_at
  before update on catalog
  for each row execute function set_updated_at();

create table catalog_product (
  catalog_id   uuid not null references catalog (id) on delete cascade,
  product_id   uuid not null references product (id) on delete cascade,
  sort_order   integer not null default 0,
  primary key (catalog_id, product_id)
);
create index catalog_product_product_idx on catalog_product (product_id);

create table price_list (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references business (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 80),
  discount_percent  numeric(5, 2) not null default 0 check (discount_percent between 0 and 100),
  is_default        boolean not null default false,
  created_at        timestamptz not null default now()
);
create index price_list_business_idx on price_list (business_id);

create table customer (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references business (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  whatsapp       text check (whatsapp is null or char_length(whatsapp) <= 25),
  email          text check (email is null or char_length(email) <= 160),
  price_list_id  uuid references price_list (id) on delete set null,
  notes          text check (notes is null or char_length(notes) <= 1000),
  created_at     timestamptz not null default now()
);
create index customer_business_idx on customer (business_id);

create table "order" (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references business (id) on delete cascade,
  catalog_id         uuid references catalog (id) on delete set null,
  customer_id        uuid references customer (id) on delete set null,
  customer_name      text not null check (char_length(customer_name) between 1 and 120),
  customer_whatsapp  text not null check (char_length(customer_whatsapp) between 5 and 25),
  customer_email     text check (customer_email is null or char_length(customer_email) <= 160),
  status             order_status not null default 'pending',
  total_cents        integer not null default 0 check (total_cents >= 0),
  currency           text not null default 'USD' check (char_length(currency) = 3),
  notes              text check (notes is null or char_length(notes) <= 1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index order_business_idx on "order" (business_id, created_at desc);
create index order_status_idx on "order" (business_id, status);

create trigger order_set_updated_at
  before update on "order"
  for each row execute function set_updated_at();

create table order_item (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references "order" (id) on delete cascade,
  product_id       uuid references product (id) on delete set null,
  product_name     text not null,
  sku              text,
  quantity         integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents   integer not null check (subtotal_cents >= 0)
);
create index order_item_order_idx on order_item (order_id);

create table paddle_customer (
  customer_id  text primary key,            -- "ctm_01h..."
  business_id  uuid references business (id) on delete set null,
  email        text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index paddle_customer_email_idx on paddle_customer (email);
create index paddle_customer_business_idx on paddle_customer (business_id);

create table paddle_subscription (
  subscription_id      text primary key,    -- "sub_01h..."
  customer_id          text not null references paddle_customer (customer_id) on delete cascade,
  business_id          uuid references business (id) on delete set null,
  status               text not null,       -- active|trialing|past_due|paused|canceled
  price_id             text,
  product_id           text,
  scheduled_change_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index paddle_sub_customer_idx on paddle_subscription (customer_id);
create index paddle_sub_business_idx on paddle_subscription (business_id);

create table processed_webhook (
  event_id      text primary key,
  processed_at  timestamptz not null default now()
);
