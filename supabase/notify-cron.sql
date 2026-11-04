-- TNR Athletics — phone notifications at the times chosen in the app (Paris time). pg_cron calls the `notify`
-- function every 5 minutes; it sends only when a chosen time has come, and never twice the same day.
-- Both keys (the function's own cron key and the public anon key) are read from the private table at run time,
-- so nothing is written here.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('tnr-notify', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://emrdmohqmswncfchbvbp.supabase.co/functions/v1/notify',
    headers := (select jsonb_build_object('Content-Type', 'application/json', 'x-notify-key', v ->> 'cronKey', 'Authorization', 'Bearer ' || (v ->> 'anonKey')) from public.recup_private where k = 'push'),
    body := '{}'::jsonb, timeout_milliseconds := 120000)
$$);
