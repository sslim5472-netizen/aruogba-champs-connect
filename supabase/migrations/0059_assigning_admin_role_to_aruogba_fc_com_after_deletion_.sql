INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'
    FROM auth.users
    WHERE email = 'Aruogba@fc.com';