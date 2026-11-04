-- TNR Athletics — notifications at 9 h and 20 h (Paris). pg_cron calls the `notify` function at both UTC hours
-- that can be 9 h / 20 h in Paris (winter and summer time); the function skips the wrong one and never sends twice.
-- The key is read from the private table at run time, so nothing secret is written here.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('tnr-notify', '0 7,8,19,20 * * *', $$
  select net.http_post(
    url := 'https://emrdmohqmswncfchbvbp.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-key', (select v ->> 'cronKey' from public.recup_private where k = 'push')),
    body := '{}'::jsonb, timeout_milliseconds := 120000)
$$);
