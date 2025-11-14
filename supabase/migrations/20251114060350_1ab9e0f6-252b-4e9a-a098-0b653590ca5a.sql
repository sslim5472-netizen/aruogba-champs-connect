-- Update function to set search_path and security definer per linter
create or replace function public.lovable_types_ping()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true
$$;