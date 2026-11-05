-- =====================================================================
-- NOIR FASHION — Supabase database schema
-- Run this whole file once in Supabase: SQL Editor → New query → Run.
-- Safe to re-run: objects are created only if they do not exist yet.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
do $$ begin
  create type product_condition as enum (
    'new_with_tags', 'new_without_tags', 'preowned_excellent', 'preowned_good');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'new', 'awaiting_confirmation', 'awaiting_payment', 'paid',
    'processing', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Admin users (passwords are handled and hashed by Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  header_image_url    text,
  header_storage_path text,
  created_at  timestamptz not null default now()
);
-- (older installs) brand header image columns
alter table public.brands add column if not exists header_image_url text;
alter table public.brands add column if not exists header_storage_path text;

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  brand_id       uuid references public.brands(id) on delete set null,
  category_id    uuid references public.categories(id) on delete set null,
  condition      product_condition not null default 'new_with_tags',
  price          numeric(10,2) not null check (price >= 0),
  sale_price     numeric(10,2) check (sale_price is null or sale_price >= 0),
  is_published   boolean not null default false,
  is_featured    boolean not null default false,
  is_new_arrival boolean not null default false,
  is_sold_out    boolean not null default false,  -- manual "uitverkocht" switch
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_published_idx on public.products(is_published, created_at desc);

create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);

-- Sizes + stock. price / sale_price are OPTIONAL per-size overrides.
create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      int not null default 0 check (stock >= 0),
  price      numeric(10,2) check (price is null or price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, size)
);
create index if not exists product_variants_product_idx on public.product_variants(product_id, sort_order);

-- The one place where a selling price is resolved. Mirrors src/lib/pricing.ts.
-- Uses ONLY prices entered by the admin; nothing is calculated or invented.
create or replace function public.effective_price(
  p_price numeric, p_sale numeric, v_price numeric, v_sale numeric)
returns numeric language sql immutable as $$
  select case
    when v_price is not null then coalesce(v_sale, v_price)
    else coalesce(v_sale, p_sale, p_price)
  end;
$$;

-- ---------------------------------------------------------------------
-- Orders (customer data is never readable by the public)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  idempotency_key uuid not null unique,
  customer_name   text not null,
  phone           text not null,
  snapchat        text,
  email           text,
  customer_notes  text,
  internal_notes  text,
  status          order_status not null default 'new',
  total           numeric(10,2) not null,
  is_seen         boolean not null default false,
  stock_restored  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

-- Snapshot of each line at order time. product_id / variant_id become NULL
-- if a product is deleted later; the copied details stay forever.
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variant_id   uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  brand_name   text,
  size         text not null,
  condition    product_condition,
  image_url    text,
  unit_price   numeric(10,2) not null,
  quantity     int not null check (quantity > 0),
  line_total   numeric(10,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- Website settings + editable information pages (public, non-sensitive)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id               int primary key default 1 check (id = 1),
  announcement     text,
  hero_title       text not null default 'CURATED LUXURY. TIMELESS STYLE.',
  hero_subtitle    text not null default 'Ontdek een zorgvuldig samengestelde collectie luxe mode en eigentijdse streetwear.',
  contact_email    text,
  whatsapp         text,
  instagram        text,
  snapchat         text,
  contact_intro    text,
  updated_at       timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.content_pages (
  slug       text primary key,
  title      text not null,
  body       text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Discount codes (managed by the admin; customers can only *use* a code)
-- ---------------------------------------------------------------------
create table if not exists public.discount_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  kind       text not null check (kind in ('percent', 'fixed')),
  value      numeric(10,2) not null check (value > 0),
  max_uses   int check (max_uses is null or max_uses >= 1),   -- NULL = unlimited
  used_count int not null default 0 check (used_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_code_format check (code ~ '^[A-Z0-9_-]{3,30}$'),
  constraint discount_percent_range check (kind <> 'percent' or value <= 100)
);
create unique index if not exists discount_codes_code_idx on public.discount_codes(code);

drop trigger if exists discount_codes_touch on public.discount_codes;
create trigger discount_codes_touch before update on public.discount_codes
  for each row execute function public.touch_updated_at();

-- Every order remembers which code was used and how much it saved. Deleting a
-- code later never changes past orders (code_id becomes NULL, the text stays).
alter table public.orders add column if not exists discount_code_id uuid references public.discount_codes(id) on delete set null;
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;

-- The one place where a discount amount is calculated (percent is rounded to
-- cents; a fixed amount can never be more than the subtotal).
create or replace function public.discount_amount(p_kind text, p_value numeric, p_subtotal numeric)
returns numeric language sql immutable as $$
  select least(greatest(coalesce(p_subtotal, 0), 0),
               case when p_kind = 'percent' then round(coalesce(p_subtotal, 0) * p_value / 100, 2) else p_value end);
$$;

-- Used by the checkout to show the discount before ordering. A code that does
-- not exist and a code that is used up give the same answer on purpose.
create or replace function public.check_discount_code(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_code discount_codes%rowtype;
begin
  select * into v_code from discount_codes where code = upper(btrim(coalesce(p_code, '')));
  if not found or (v_code.max_uses is not null and v_code.used_count >= v_code.max_uses) then
    return jsonb_build_object('ok', false, 'error', 'invalid_discount');
  end if;
  return jsonb_build_object('ok', true, 'code', v_code.code, 'kind', v_code.kind, 'value', v_code.value,
                            'discount', public.discount_amount(v_code.kind, v_code.value, p_subtotal));
end;
$$;

-- ---------------------------------------------------------------------
-- place_order: the ONLY way the public can create an order.
-- Validates input, prices every line from the database (never from the
-- browser), reserves stock atomically and is idempotent per checkout.
-- ---------------------------------------------------------------------
drop function if exists public.place_order(uuid, text, text, text, text, text, jsonb);
create or replace function public.place_order(
  p_idempotency_key uuid,
  p_name text, p_phone text, p_snapchat text, p_email text, p_notes text,
  p_items jsonb, p_discount_code text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_existing record;
  v_order_id uuid;
  v_number text;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_qty int;
  v_row record;
  v_price numeric(10,2);
  v_lines jsonb := '[]'::jsonb;
  v_detail text;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s\-\.\(\)]', '', 'g');
  v_snap text := nullif(btrim(coalesce(p_snapchat, '')), '');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_dcode text := nullif(upper(btrim(coalesce(p_discount_code, ''))), '');
  v_code discount_codes%rowtype;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
begin
  -- Same checkout submitted twice → return the first order, do nothing new.
  select order_number, total into v_existing from orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok', true, 'order_number', v_existing.order_number,
                              'total', v_existing.total, 'duplicate', true);
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if v_phone !~ '^(\+|00)?[0-9]{8,15}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if v_snap is not null then
    v_snap := ltrim(v_snap, '@');
    if v_snap !~ '^[A-Za-z][A-Za-z0-9._-]{1,29}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid_snapchat');
    end if;
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if v_notes is not null and char_length(v_notes) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_notes');
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    return jsonb_build_object('ok', false, 'error', 'empty_cart');
  end if;
  if v_dcode is not null and v_dcode !~ '^[A-Z0-9_-]{3,30}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_discount');
  end if;

  v_order_id := gen_random_uuid();

  -- Lock variants in a stable order to avoid deadlocks between buyers.
  for v_item in
    select value from jsonb_array_elements(p_items) order by value->>'variant_id'
  loop
    begin
      v_qty := (v_item->>'quantity')::int;
    exception when others then
      return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
    end;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
    end if;

    select v.id as variant_id, v.size, v.stock, v.price as v_price, v.sale_price as v_sale,
           p.id as product_id, p.name, p.price as p_price, p.sale_price as p_sale,
           p.condition, p.is_published, p.is_sold_out, b.name as brand_name,
           (select url from product_images i where i.product_id = p.id
             order by sort_order, created_at limit 1) as image_url
      into v_row
      from product_variants v
      join products p on p.id = v.product_id
      left join brands b on b.id = p.brand_id
     where v.id = (v_item->>'variant_id')::uuid
       for update of v;

    if not found or not v_row.is_published then
      raise exception using errcode = 'P0001', message = 'unavailable',
        detail = coalesce(v_item->>'variant_id', '');
    end if;
    if v_row.is_sold_out or v_row.stock < v_qty then
      raise exception using errcode = 'P0001', message = 'insufficient_stock',
        detail = v_row.name || ' (' || v_row.size || ')';
    end if;

    v_price := effective_price(v_row.p_price, v_row.p_sale, v_row.v_price, v_row.v_sale);
    update product_variants set stock = stock - v_qty where id = v_row.variant_id;

    v_total := v_total + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_row.product_id, 'variant_id', v_row.variant_id,
      'product_name', v_row.name, 'brand_name', v_row.brand_name, 'size', v_row.size,
      'condition', v_row.condition, 'image_url', v_row.image_url,
      'unit_price', v_price, 'quantity', v_qty, 'line_total', v_price * v_qty);
  end loop;

  -- Discount code: re-checked here, inside the same transaction as the stock
  -- reservation. The code row is locked, so two customers can never use the
  -- last remaining use at the same time. Any failure rolls everything back.
  v_subtotal := v_total;
  if v_dcode is not null then
    select * into v_code from discount_codes where code = v_dcode for update;
    if not found or (v_code.max_uses is not null and v_code.used_count >= v_code.max_uses) then
      raise exception using errcode = 'P0001', message = 'invalid_discount';
    end if;
    v_discount := discount_amount(v_code.kind, v_code.value, v_subtotal);
    update discount_codes set used_count = used_count + 1 where id = v_code.id;
    v_total := v_subtotal - v_discount;
  end if;

  -- Unique, human-friendly order number, e.g. NF-261101-7K3Q
  loop
    v_number := 'NF-' || to_char(now() at time zone 'Europe/Amsterdam', 'YYMMDD') || '-' ||
      upper(substr(translate(md5(gen_random_uuid()::text), 'OI01l', ''), 1, 4));
    exit when char_length(v_number) = 14 and not exists (select 1 from orders where order_number = v_number);
  end loop;

  insert into orders (id, order_number, idempotency_key, customer_name, phone, snapchat,
                      email, customer_notes, total, discount_code_id, discount_code, discount_amount)
  values (v_order_id, v_number, p_idempotency_key, v_name, v_phone, v_snap, v_email, v_notes, v_total,
          v_code.id, v_code.code, v_discount);

  insert into order_items (order_id, product_id, variant_id, product_name, brand_name, size,
                           condition, image_url, unit_price, quantity, line_total)
  select v_order_id, (l->>'product_id')::uuid, (l->>'variant_id')::uuid, l->>'product_name',
         l->>'brand_name', l->>'size', (l->>'condition')::product_condition, l->>'image_url',
         (l->>'unit_price')::numeric, (l->>'quantity')::int, (l->>'line_total')::numeric
    from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('ok', true, 'order_number', v_number, 'total', v_total,
                            'subtotal', v_subtotal, 'discount_amount', v_discount, 'discount_code', v_code.code,
                            'items', v_lines, 'duplicate', false);
exception
  when raise_exception then
    -- Any stock already reserved in this call is rolled back automatically.
    get stacked diagnostics v_detail = pg_exception_detail;
    return jsonb_build_object('ok', false, 'error', sqlerrm, 'detail', v_detail);
  when unique_violation then
    -- Two identical submissions raced; return the one that won.
    select order_number, total into v_existing from orders where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('ok', true, 'order_number', v_existing.order_number,
                                'total', v_existing.total, 'duplicate', true);
    end if;
    return jsonb_build_object('ok', false, 'error', 'server_error');
end;
$$;

-- Admin: change an order's status. Cancelling returns reserved stock once;
-- re-opening a cancelled order reserves it again.
create or replace function public.set_order_status(p_order_id uuid, p_status order_status)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_order orders%rowtype; v_short int;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select * into v_order from orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;

  if p_status = 'cancelled' and not v_order.stock_restored then
    update product_variants v set stock = v.stock + oi.quantity
      from order_items oi where oi.order_id = p_order_id and oi.variant_id = v.id;
    update orders set stock_restored = true where id = p_order_id;
    -- a cancelled order no longer counts as a use of its discount code
    update discount_codes set used_count = greatest(used_count - 1, 0) where id = v_order.discount_code_id;
  elsif p_status <> 'cancelled' and v_order.stock_restored then
    select count(*) into v_short from order_items oi join product_variants v on v.id = oi.variant_id
     where oi.order_id = p_order_id and v.stock < oi.quantity;
    if v_short > 0 then
      return jsonb_build_object('ok', false, 'error', 'insufficient_stock');
    end if;
    update product_variants v set stock = v.stock - oi.quantity
      from order_items oi where oi.order_id = p_order_id and oi.variant_id = v.id;
    update orders set stock_restored = false where id = p_order_id;
    update discount_codes set used_count = used_count + 1 where id = v_order.discount_code_id;
  end if;

  update orders set status = p_status, is_seen = true where id = p_order_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.admin_users      enable row level security;
alter table public.brands           enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.site_settings    enable row level security;
alter table public.content_pages    enable row level security;
alter table public.discount_codes   enable row level security;

do $$
declare t text;
begin
  -- Admins may do everything on every table.
  foreach t in array array['brands','categories','products','product_images','product_variants',
                           'orders','order_items','site_settings','content_pages','discount_codes'] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin read admins" on public.admin_users;
create policy "admin read admins" on public.admin_users for select to authenticated
  using (public.is_admin());

-- Public (anon + logged in) read access: only what the shop shows.
drop policy if exists "public read brands" on public.brands;
create policy "public read brands" on public.brands for select using (is_active);
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (is_published);
drop policy if exists "public read images" on public.product_images;
create policy "public read images" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));
drop policy if exists "public read variants" on public.product_variants;
create policy "public read variants" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
drop policy if exists "public read pages" on public.content_pages;
create policy "public read pages" on public.content_pages for select using (true);
-- orders / order_items / discount_codes: NO public policies → customers can never
-- read any order and can never list discount codes (they can only try one).

-- Function permissions
revoke all on function public.place_order(uuid, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(uuid, text, text, text, text, text, jsonb, text) to anon, authenticated;
revoke all on function public.check_discount_code(text, numeric) from public;
grant execute on function public.check_discount_code(text, numeric) to anon, authenticated;
revoke all on function public.set_order_status(uuid, order_status) from public, anon;
grant execute on function public.set_order_status(uuid, order_status) to authenticated;

-- ---------------------------------------------------------------------
-- Storage bucket for product photos (public read, admin write)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "noir public read images" on storage.objects;
create policy "noir public read images" on storage.objects for select
  using (bucket_id = 'product-images');
drop policy if exists "noir admin upload images" on storage.objects;
create policy "noir admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "noir admin update images" on storage.objects;
create policy "noir admin update images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "noir admin delete images" on storage.objects;
create policy "noir admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- Starting data: brands and categories only (no products, prices or stock)
-- ---------------------------------------------------------------------
insert into public.brands (name, slug, sort_order) values
  ('Fear of God Essentials', 'essentials', 1),
  ('Hermès', 'hermes', 2),
  ('ALO Yoga', 'alo-yoga', 3),
  ('Acne Studios', 'acne-studios', 4),
  ('Stone Island', 'stone-island', 5),
  ('Ralph Lauren', 'ralph-lauren', 6),
  ('Moncler', 'moncler', 7),
  ('Casablanca', 'casablanca', 8),
  ('Dior', 'dior', 9),
  ('Canada Goose', 'canada-goose', 10)
on conflict (slug) do nothing;

insert into public.categories (name, slug, sort_order) values
  ('Jassen', 'jassen', 1),
  ('Hoodies & sweaters', 'hoodies-sweaters', 2),
  ('T-shirts & tops', 't-shirts-tops', 3),
  ('Overhemden', 'overhemden', 4),
  ('Broeken', 'broeken', 5),
  ('Sportkleding', 'sportkleding', 6),
  ('Schoenen', 'schoenen', 7),
  ('Tassen', 'tassen', 8),
  ('Accessoires', 'accessoires', 9)
on conflict (slug) do nothing;
