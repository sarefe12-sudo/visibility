-- Run this once in Supabase SQL Editor
-- Atomic increment to avoid race conditions when multiple requests hit simultaneously

create or replace function increment_analyses_count(user_id_input uuid)
returns void
language sql
as $$
  update users set analyses_count = analyses_count + 1 where id = user_id_input;
$$;
