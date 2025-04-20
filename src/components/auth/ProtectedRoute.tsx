
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
  const { user, isLoading, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  // Function to check authorization
  const checkAuthorization = async () => {
    if (isLoading) {
      console.log("Auth is loading, waiting...");
      return; // Wait until auth is loaded
    }

    // Always refresh user profile when route components are loaded
    // This ensures we have the latest role information
    if (!hasCheckedAuth) {
      console.log("First auth check, refreshing user profile");
      await refreshUserProfile();
      setHasCheckedAuth(true);
    }
    
    // Re-check user after profile refresh
    if (!user) {
      console.log("No user found, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }
    
    console.log(`Checking authorization for user with role: ${user.role} at path: ${location.pathname}`);
    console.log(`Allowed roles: ${allowedRoles ? allowedRoles.join(', ') : 'any'}`);
    
    // If allowedRoles is specified, check if user has permission
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not authorized for ${location.pathname}. Allowed roles: ${allowedRoles.join(', ')}`);
      
      toast({
        title: "Access Denied",
        description: `You don't have permission to access this page. Required role: ${allowedRoles.join(' or ')}`,
        variant: "destructive",
      });
      
      // Redirect based on user role
      setTimeout(() => {
        redirectBasedOnRole(user.role);
      }, 500);
      
      return;
    }
    
    console.log(`User authorized with role: ${user.role} for path: ${location.pathname}`);
    setIsAuthorized(true);
  };
  
  useEffect(() => {
    checkAuthorization();
  }, [user, isLoading]);

  // Add separate effect to handle path changes
  useEffect(() => {
    if (hasCheckedAuth && user) {
      // Reset authorization on path change
      setIsAuthorized(false);
      
      console.log(`Path changed to ${location.pathname}, refreshing user profile`);
      
      // Always refresh user profile when the path changes
      // This ensures we have the latest role information
      refreshUserProfile().then(() => {
        // Check if user has permission for new path
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          console.log(`User role ${user.role} not authorized for ${location.pathname}. Allowed roles: ${allowedRoles.join(', ')}`);
          
          toast({
            title: "Access Denied",
            description: `You don't have permission to access this page. Required role: ${allowedRoles.join(' or ')}`,
            variant: "destructive",
          });
          
          // Redirect based on user role
          setTimeout(() => {
            redirectBasedOnRole(user.role);
          }, 500);
          
          return;
        }
        
        console.log(`User authorized with role: ${user?.role} for path: ${location.pathname}`);
        setIsAuthorized(true);
      });
    }
  }, [location.pathname, allowedRoles]);

  const redirectBasedOnRole = (role: UserRole) => {
    switch(role) {
      case 'admin':
        navigate('/dashboard', { replace: true });
        break;
      case 'manager':
        navigate('/menu', { replace: true });
        break;
      case 'cashier':
        navigate('/new-order', { replace: true });
        break;
      default:
        navigate('/unauthorized', { replace: true });
        break;
    }
  };

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
