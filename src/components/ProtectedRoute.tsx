import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { session, isAdmin, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading authentication...</div>;
  }

  if (!session) {
    // Not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.includes('admin') && !isAdmin) {
    // Authenticated but not an admin, redirect to home or a forbidden page
    return <Navigate to="/" replace />; // Or a specific /forbidden page
  }

  // Authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;