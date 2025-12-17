DELETE FROM public.user_roles
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'referee@fc.com');

    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'referee'
    FROM auth.users
    WHERE email = 'referee@fc.com';