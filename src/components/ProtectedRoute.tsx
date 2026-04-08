import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const auth = useAuth();

  if (auth.loading) return null; // or a spinner
  if (!auth.isAuthenticated) return <Navigate to="/portal" replace />;

  if (allowedRoles && allowedRoles.length) {
    const role = (auth.user?.role || '').toString().toLowerCase();
    if (!allowedRoles.map(r => r.toLowerCase()).includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
