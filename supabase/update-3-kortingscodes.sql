-- =====================================================================
-- NOIR FASHION — Update 3: kortingscodes (discount codes)
-- Run ONCE in Supabase → SQL Editor → paste everything → Run.
-- Safe to run again. Products, prices, orders and brands are not touched.
-- =====================================================================

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
-- Security: only the admin can see or change codes; customers can only
-- try a code through check_discount_code / place_order.
-- ---------------------------------------------------------------------
alter table public.discount_codes enable row level security;
drop policy if exists "admin all" on public.discount_codes;
create policy "admin all" on public.discount_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on function public.place_order(uuid, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(uuid, text, text, text, text, text, jsonb, text) to anon, authenticated;
revoke all on function public.check_discount_code(text, numeric) from public;
grant execute on function public.check_discount_code(text, numeric) to anon, authenticated;
revoke all on function public.set_order_status(uuid, order_status) from public, anon;
grant execute on function public.set_order_status(uuid, order_status) to authenticated;

-- Check: should list the new table and show 0 rows.
select count(*) as kortingscodes from public.discount_codes;
