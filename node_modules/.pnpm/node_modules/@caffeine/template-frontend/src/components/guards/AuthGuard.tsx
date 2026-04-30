import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Memeriksa autentikasi..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
}
