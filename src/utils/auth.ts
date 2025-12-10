import { AuthApiError } from '@supabase/supabase-js';

export const handleAuthError = (error: AuthApiError | Error): string => {
  if (error instanceof AuthApiError) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please try again.';
      case 'Email not confirmed':
        return 'Please confirm your email address to log in.';
      case 'User already registered':
        return 'An account with this email already exists. Please log in.';
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};