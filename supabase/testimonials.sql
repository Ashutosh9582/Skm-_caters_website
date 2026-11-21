-- SKM Caters: Customer Testimonials. Run once in Supabase > SQL Editor (needs setup.sql to have been run first).
create table if not exists public.web_testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  event_name  text default '' check (char_length(event_name) <= 120),
  review      text not null check (char_length(review) between 5 and 1000),
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.web_testimonials enable row level security;

drop policy if exists "public reads published reviews" on public.web_testimonials;
create policy "public reads published reviews" on public.web_testimonials for select
  to anon, authenticated using (published = true or public.is_partner());
drop policy if exists "partners insert reviews" on public.web_testimonials;
create policy "partners insert reviews" on public.web_testimonials for insert to authenticated with check (public.is_partner());
drop policy if exists "partners update reviews" on public.web_testimonials;
create policy "partners update reviews" on public.web_testimonials for update to authenticated using (public.is_partner()) with check (public.is_partner());
drop policy if exists "partners delete reviews" on public.web_testimonials;
create policy "partners delete reviews" on public.web_testimonials for delete to authenticated using (public.is_partner());
