-- =====================================================================
-- NOIR FASHION — update 2: brand pages & brand management
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again. Does not touch products, prices or orders.
-- =====================================================================

-- Brand header / brand photo
alter table public.brands add column if not exists header_image_url text;
alter table public.brands add column if not exists header_storage_path text;

-- Shorter URL: /merken/essentials (old link redirects automatically)
update public.brands set slug = 'essentials'
 where slug = 'fear-of-god-essentials'
   and not exists (select 1 from public.brands where slug = 'essentials');

-- Make sure all ten starting brands exist (skips any you already have)
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
