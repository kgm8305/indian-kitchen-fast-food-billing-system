
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized');
    }
  }, [user, isLoading, navigate, allowedRoles]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Will redirect to unauthorized
  }

  return <>{children}</>;
};

export default ProtectedRoute;
