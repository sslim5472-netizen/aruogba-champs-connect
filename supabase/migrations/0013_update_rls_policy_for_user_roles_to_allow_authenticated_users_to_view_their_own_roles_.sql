-- Drop the overly permissive policy
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

-- Create a new policy: Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);