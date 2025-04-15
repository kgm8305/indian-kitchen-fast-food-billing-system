
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth is loaded
    }
    
    // Quick check for unauthorized state to redirect faster
    if (!user) {
      console.log("No user found, redirecting to login");
      navigate('/login');
      return;
    }
    
    // If allowedRoles is specified, check if user has permission
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not authorized for ${location.pathname}. Allowed roles: ${allowedRoles.join(', ')}`);
      
      toast({
        title: "Access Denied",
        description: `You don't have permission to access this page. Required role: ${allowedRoles.join(' or ')}`,
        variant: "destructive",
      });
      
      // Redirect based on user role
      let redirectPath = '/unauthorized';
      
      // Add a slight delay to allow toast to be visible
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/dashboard');
        } else if (user.role === 'manager') {
          navigate('/dashboard');
        } else if (user.role === 'cashier') {
          navigate('/dashboard');
        } else {
          navigate(redirectPath);
        }
      }, 500);
      
      return;
    }
    
    console.log(`User authorized with role: ${user.role} for path: ${location.pathname}`);
    setIsAuthorized(true);
    
  }, [user, isLoading, navigate, allowedRoles, location.pathname]);

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
