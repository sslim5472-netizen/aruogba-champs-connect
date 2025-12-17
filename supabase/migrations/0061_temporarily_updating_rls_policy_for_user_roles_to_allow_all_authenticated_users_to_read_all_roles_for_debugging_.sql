DROP POLICY IF EXISTS "Allow authenticated users to view their own roles" ON public.user_roles;

    CREATE POLICY "Temporary: Allow all authenticated users to view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (true);