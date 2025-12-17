CREATE OR REPLACE FUNCTION public.handle_match_stats_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'finished' THEN
      PERFORM public.update_team_stats_from_match_result(NEW, 'add');
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Case 1: Status changed to 'finished' from not 'finished'
    IF OLD.status <> 'finished' AND NEW.status = 'finished' THEN
      PERFORM public.update_team_stats_from_match_result(NEW, 'add');
    -- Case 2: Status was 'finished' and is still 'finished', but scores changed
    ELSIF OLD.status = 'finished' AND NEW.status = 'finished' AND
          (OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score) THEN
      PERFORM public.update_team_stats_from_match_result(OLD, 'subtract'); -- Revert old stats
      PERFORM public.update_team_stats_from_match_result(NEW, 'add');      -- Apply new stats
    -- Case 3: Status was 'finished' and changed to not 'finished' (e.g., scheduled/live)
    ELSIF OLD.status = 'finished' AND NEW.status <> 'finished' THEN
      PERFORM public.update_team_stats_from_match_result(OLD, 'subtract');
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'finished' THEN
      PERFORM public.update_team_stats_from_match_result(OLD, 'subtract');
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

-- Drop existing trigger if it exists to replace it
DROP TRIGGER IF EXISTS update_team_stats_on_match_change ON public.matches;

CREATE TRIGGER update_team_stats_on_match_change
AFTER INSERT OR UPDATE OF status, home_score, away_score OR DELETE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.handle_match_stats_update();