-- TNR Athletics — phone notifications at the times chosen in the app (Paris time). pg_cron calls the `notify`
-- function every 5 minutes; it sends only when a chosen time has come, and never twice the same day.
-- The key is read from the private table at run time, so nothing secret is written here.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('tnr-notify', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://emrdmohqmswncfchbvbp.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-key', (select v ->> 'cronKey' from public.recup_private where k = 'push')),
    body := '{}'::jsonb, timeout_milliseconds := 120000)
$$);
