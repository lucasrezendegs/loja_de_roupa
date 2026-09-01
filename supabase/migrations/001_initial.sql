create extension if not exists pgcrypto;

create table if not exists public.clothing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  size text,
  color text,
  brand text,
  season text,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clothing enable row level security;

drop policy if exists "Users can view own clothing" on public.clothing;
drop policy if exists "Users can insert own clothing" on public.clothing;
drop policy if exists "Users can update own clothing" on public.clothing;
drop policy if exists "Users can delete own clothing" on public.clothing;

create policy "Users can view own clothing" on public.clothing for select using (auth.uid() = user_id);
create policy "Users can insert own clothing" on public.clothing for insert with check (auth.uid() = user_id);
create policy "Users can update own clothing" on public.clothing for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own clothing" on public.clothing for delete using (auth.uid() = user_id);

create index if not exists clothing_user_id_idx on public.clothing(user_id);
create index if not exists clothing_category_idx on public.clothing(category);

-- Bucket opcional para fotos futuras. A primeira versão usa URL de imagem no cadastro.
insert into storage.buckets (id, name, public)
values ('clothing-images', 'clothing-images', true)
on conflict (id) do nothing;
