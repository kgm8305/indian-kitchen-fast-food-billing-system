
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, RefreshCw } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';

const Header = () => {
  const { user, logout, refreshUserProfile } = useAuth();
  const { projectName } = useBranding();
  const navigate = useNavigate();

  // Early return with null if no user context is available
  if (!user) {
    console.log('Header: No user found in context');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleRefreshProfile = async () => {
    console.log('Header: Refreshing user profile');
    if (user) {
      await refreshUserProfile();
    }
  };

  return (
    <header className="bg-white dark:bg-[#222] border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-orange">
            {projectName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshProfile}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
