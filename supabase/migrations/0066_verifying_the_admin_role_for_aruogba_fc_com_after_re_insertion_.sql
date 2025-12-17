SELECT
          au.id AS auth_user_id,
          au.email,
          ur.role AS assigned_role
        FROM auth.users AS au
        LEFT JOIN public.user_roles AS ur ON au.id = ur.user_id
        WHERE au.email = 'Aruogba@fc.com';