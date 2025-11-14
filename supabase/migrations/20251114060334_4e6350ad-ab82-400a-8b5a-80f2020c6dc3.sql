-- Minimal harmless function to trigger type generation
create or replace function public.lovable_types_ping()
returns boolean
language sql
stable
as $$
  select true
$$;