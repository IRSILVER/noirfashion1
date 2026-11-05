-- NOIR FASHION — update 4: telefoon OF snapchat + kleuren per product
-- Veilig om meerdere keren te draaien.

alter table public.orders alter column phone drop not null;

alter table public.product_variants add column if not exists color text;
alter table public.product_images   add column if not exists color text;
alter table public.product_variants drop constraint if exists product_variants_product_id_size_key;
create unique index if not exists product_variants_unique_idx
  on public.product_variants (product_id, coalesce(color, ''), size);

drop function if exists public.place_order(uuid, text, text, text, text, text, jsonb, text);
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
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[\s\-\.\(\)]', '', 'g'), '');
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
  if v_phone is not null and v_phone !~ '^(\+|00)?[0-9]{8,15}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if v_snap is not null then
    v_snap := ltrim(v_snap, '@');
    if v_snap !~ '^[A-Za-z][A-Za-z0-9._-]{1,29}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid_snapchat');
    end if;
  end if;
  -- The customer must give a way to reach them: phone OR Snapchat (one is enough).
  if v_phone is null and v_snap is null then
    return jsonb_build_object('ok', false, 'error', 'contact_required');
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

    select v.id as variant_id, v.size, v.color, v.stock, v.price as v_price, v.sale_price as v_sale,
           p.id as product_id, p.name, p.price as p_price, p.sale_price as p_sale,
           p.condition, p.is_published, p.is_sold_out, b.name as brand_name,
           (select i.url from product_images i where i.product_id = p.id
             order by coalesce(i.color = v.color, false) desc, (i.color is null) desc, i.sort_order, i.created_at limit 1) as image_url
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
        detail = v_row.name || ' (' || case when v_row.color is not null then v_row.color || ' · ' || v_row.size else v_row.size end || ')';
    end if;

    v_price := effective_price(v_row.p_price, v_row.p_sale, v_row.v_price, v_row.v_sale);
    update product_variants set stock = stock - v_qty where id = v_row.variant_id;

    v_total := v_total + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_row.product_id, 'variant_id', v_row.variant_id,
      'product_name', v_row.name, 'brand_name', v_row.brand_name, 'size', case when v_row.color is not null then v_row.color || ' · ' || v_row.size else v_row.size end,
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

revoke all on function public.place_order(uuid, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(uuid, text, text, text, text, text, jsonb, text) to anon, authenticated;

select count(*) as varianten from public.product_variants;
