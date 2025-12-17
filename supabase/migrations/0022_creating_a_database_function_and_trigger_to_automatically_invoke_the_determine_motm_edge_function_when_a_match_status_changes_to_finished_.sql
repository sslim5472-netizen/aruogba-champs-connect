-- Ensure the pg_net extension is enabled for HTTP requests from the database
-- If you encounter errors, you might need to enable it manually in Supabase Dashboard -> Database -> Extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that calls the 'determine-motm' Edge Function
CREATE OR REPLACE FUNCTION public.invoke_determine_motm_on_match_finish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wefsjwyscsotbwbdwuyb.supabase.co/functions/v1/determine-motm',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZnNqd3lzY3NvdGJ3YmR3dXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzE0MTMsImV4cCI6MjA3ODY0NzQxM30.caFbp4X5SR7pI-JpF9u0VdM-X0BmESVMsdFyhFl62Hc'
    ),
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create a trigger that executes the function after a match's status changes to 'finished'
DROP TRIGGER IF EXISTS trigger_determine_motm_on_finish ON public.matches;
CREATE TRIGGER trigger_determine_motm_on_finish
AFTER UPDATE OF status ON public.matches
FOR EACH ROW
WHEN (NEW.status = 'finished' AND OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.invoke_determine_motm_on_match_finish();