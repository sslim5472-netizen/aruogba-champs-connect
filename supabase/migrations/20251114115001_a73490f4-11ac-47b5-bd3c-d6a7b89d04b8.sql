-- Add explicit RLS policies for UPDATE and DELETE on votes table
-- This makes vote immutability explicit and prevents accidental policy changes

-- Explicitly deny all updates to votes (votes should be immutable)
CREATE POLICY "Votes cannot be updated" 
ON public.votes 
FOR UPDATE 
USING (false);

-- Allow admins to delete votes for moderation purposes
CREATE POLICY "Admins can delete votes" 
ON public.votes 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);