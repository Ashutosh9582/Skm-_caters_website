-- SKM Caters: Data API permissions. Run once in Supabase > SQL Editor (safe to run again).
-- Newer Supabase projects do not automatically expose SQL-created tables to the API.
-- Row-level security (already enabled) still decides which rows anyone can see or change.
grant usage on schema public to anon, authenticated;
grant execute on function public.is_partner() to anon, authenticated;

grant select on public.web_gallery to anon;
grant insert on public.web_enquiries to anon;
grant select on public.web_testimonials to anon;

grant select, insert, update, delete on public.web_gallery to authenticated;
grant select, insert, update, delete on public.web_enquiries to authenticated;
grant select, insert, update, delete on public.web_testimonials to authenticated;
