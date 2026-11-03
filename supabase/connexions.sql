-- TNR Athletics — keys pasted in Réglages > Connexions. They go to public.recup_private (RLS on, no policy),
-- only through these two functions, and only for Oscar's signed-in account. Secrets never come back to the app.
alter table public.recup_private enable row level security;

create or replace function public.recup_key_set(p_k text, p_v jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'oscarbracq@yahoo.com' then raise exception 'non autorisé'; end if;
  if p_k not in ('garmin', 'withings') then raise exception 'clé inconnue'; end if;
  insert into public.recup_private (k, v, updated_at) values (p_k, p_v, now())
  on conflict (k) do update set v = coalesce(public.recup_private.v, '{}'::jsonb) || excluded.v, updated_at = now();
end $$;

-- What the settings show: which keys are there, never their values (the Withings client ID is public anyway).
create or replace function public.recup_key_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare g jsonb; w jsonb;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'oscarbracq@yahoo.com' then raise exception 'non autorisé'; end if;
  select v into g from public.recup_private where k = 'garmin';
  select v into w from public.recup_private where k = 'withings';
  return jsonb_build_object(
    'garminKey', coalesce(g ->> 'apiKey', '') <> '',
    'withingsClient', w ->> 'client_id',
    'withingsSecret', coalesce(w ->> 'client_secret', '') <> '',
    'withingsLinked', coalesce(w ->> 'refresh_token', '') <> '',
    'withingsLinkedAt', w ->> 'linkedAt');
end $$;

revoke all on function public.recup_key_set(text, jsonb) from public, anon;
revoke all on function public.recup_key_state() from public, anon;
grant execute on function public.recup_key_set(text, jsonb) to authenticated;
grant execute on function public.recup_key_state() to authenticated;
