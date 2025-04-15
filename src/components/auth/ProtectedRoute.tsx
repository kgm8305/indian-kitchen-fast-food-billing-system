
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';

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
        console.log("No user found, redirecting to login");
        navigate('/login');
        return;
      }
      
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log(`User role ${user.role} not authorized for this page. Allowed roles: ${allowedRoles.join(', ')}`);
        toast({
          title: "Access Denied",
          description: `You don't have permission to access this page. Required role: ${allowedRoles.join(' or ')}`,
          variant: "destructive",
        });
        navigate('/unauthorized');
        return;
      }
      
      console.log(`User authorized with role: ${user.role}`);
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
