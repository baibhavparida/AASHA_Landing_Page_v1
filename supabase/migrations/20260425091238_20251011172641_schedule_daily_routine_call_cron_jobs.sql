/*
  # Schedule Daily Routine Call Cron Jobs
  Schedules morning, afternoon, and evening call triggers via pg_cron.
*/

DO $$
BEGIN
  PERFORM cron.unschedule('daily-routine-calls-morning');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-routine-calls-afternoon');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-routine-calls-evening');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('daily-routine-calls-morning', '0 8 * * *', $$SELECT trigger_daily_routine_calls('morning')$$);
SELECT cron.schedule('daily-routine-calls-afternoon', '0 14 * * *', $$SELECT trigger_daily_routine_calls('afternoon')$$);
SELECT cron.schedule('daily-routine-calls-evening', '0 19 * * *', $$SELECT trigger_daily_routine_calls('evening')$$);
