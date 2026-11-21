-- SKM Caters: Website Media & Gallery. Run once in Supabase > SQL Editor > New query > Run.
-- Uses V6's existing login: any ACTIVE row in public.partners can manage media.
-- The public website (anon key) can read ONLY rows where published = true.

create or replace function public.is_partner() returns boolean
language sql security definer set search_path = public stable as
$$ select exists (select 1 from public.partners where id = auth.uid() and active = true) $$;

create table if not exists public.web_gallery (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  thumb_url    text,
  storage_path text,
  thumb_path   text,
  event_title  text default '',
  caption      text default '',
  category     text default 'Other Events',
  album        text default '',
  published    boolean not null default false,
  featured     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.web_gallery enable row level security;

drop policy if exists "public reads published" on public.web_gallery;
create policy "public reads published" on public.web_gallery for select
  to anon, authenticated using (published = true or public.is_partner());

drop policy if exists "partners insert" on public.web_gallery;
create policy "partners insert" on public.web_gallery for insert to authenticated with check (public.is_partner());
drop policy if exists "partners update" on public.web_gallery;
create policy "partners update" on public.web_gallery for update to authenticated using (public.is_partner()) with check (public.is_partner());
drop policy if exists "partners delete" on public.web_gallery;
create policy "partners delete" on public.web_gallery for delete to authenticated using (public.is_partner());

-- Storage bucket: public read of files, only partners can upload/replace/delete. Images only, 10 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-media', 'website-media', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "partners upload media" on storage.objects;
create policy "partners upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-media' and public.is_partner());
drop policy if exists "partners update media" on storage.objects;
create policy "partners update media" on storage.objects for update to authenticated
  using (bucket_id = 'website-media' and public.is_partner());
drop policy if exists "partners delete media" on storage.objects;
create policy "partners delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'website-media' and public.is_partner());

-- ===================== WEBSITE ENQUIRIES =====================
-- Website visitors (anon) can only INSERT. Only active V6 partners can read/update/delete.
create table if not exists public.web_enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  phone       text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  event_type  text default '' check (char_length(event_type) <= 60),
  event_date  date,
  location    text default '' check (char_length(location) <= 200),
  guests      integer check (guests is null or guests between 1 and 100000),
  message     text default '' check (char_length(message) <= 2000),
  status      text not null default 'new' check (status in ('new','read','contacted','confirmed','closed')),
  is_read     boolean not null default false,
  history     jsonb not null default '[]'::jsonb,
  dedupe_key  text unique
);

-- Server-side: same enquiry (email+phone+event+date) on the same day is stored once; history starts with "new".
create or replace function public.web_enquiries_prep() returns trigger language plpgsql as $$
begin
  new.dedupe_key := md5(lower(new.email)||'|'||new.phone||'|'||coalesce(new.event_type,'')||'|'||coalesce(new.event_date::text,'')||'|'||current_date::text);
  new.history := jsonb_build_array(jsonb_build_object('s','new','t',now()));
  return new;
end $$;
drop trigger if exists web_enquiries_prep on public.web_enquiries;
create trigger web_enquiries_prep before insert on public.web_enquiries for each row execute function public.web_enquiries_prep();

alter table public.web_enquiries enable row level security;
drop policy if exists "public can submit" on public.web_enquiries;
create policy "public can submit" on public.web_enquiries for insert to anon, authenticated
  with check (status = 'new' and is_read = false);
drop policy if exists "partners read enquiries" on public.web_enquiries;
create policy "partners read enquiries" on public.web_enquiries for select to authenticated using (public.is_partner());
drop policy if exists "partners update enquiries" on public.web_enquiries;
create policy "partners update enquiries" on public.web_enquiries for update to authenticated using (public.is_partner()) with check (public.is_partner());
drop policy if exists "partners delete enquiries" on public.web_enquiries;
create policy "partners delete enquiries" on public.web_enquiries for delete to authenticated using (public.is_partner());

-- Live notifications in V6
do $$ begin
  alter publication supabase_realtime add table public.web_enquiries;
exception when duplicate_object then null; end $$;

-- ===================== TESTIMONIALS =====================
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
