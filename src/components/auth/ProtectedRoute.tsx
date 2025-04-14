
import { useEffect, useState } from 'react';
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
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Quick check for unauthorized state to redirect faster
    if (!isLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        navigate('/unauthorized');
        return;
      }
      
      setIsAuthorized(true);
    }
  }, [user, isLoading, navigate, allowedRoles]);

  // Show a simple loading indicator instead of a full-page loader
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoute;
