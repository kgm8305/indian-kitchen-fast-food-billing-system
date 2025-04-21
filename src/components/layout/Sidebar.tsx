
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Coffee, 
  ShoppingCart, 
  BarChart, 
  MenuSquare,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  if (!user) return null;

  // Define navigation items based on user role
  const navigationItems = [
    { 
      label: 'Dashboard', 
      icon: <Home className="h-5 w-5" />, 
      href: '/dashboard', 
      roles: ['admin', 'manager', 'cashier'] 
    },
    { 
      label: 'Menu Management', 
      icon: <Coffee className="h-5 w-5" />, 
      href: '/menu', 
      roles: ['manager'] 
    },
    { 
      label: 'Orders', 
      icon: <ShoppingCart className="h-5 w-5" />, 
      href: '/orders', 
      roles: ['admin', 'manager', 'cashier'] 
    },
    { 
      label: 'New Order', 
      icon: <MenuSquare className="h-5 w-5" />, 
      href: '/new-order', 
      roles: ['cashier'] 
    },
    { 
      label: 'User Management', 
      icon: <Users className="h-5 w-5" />, 
      href: '/users', 
      roles: ['admin'] 
    },
    { 
      label: 'Reports', 
      icon: <BarChart className="h-5 w-5" />, 
      href: '/reports', 
      roles: ['admin'] 
    },
    {
      label: 'Settings',
      icon: <SettingsIcon className="h-5 w-5" />,
      href: '/settings',
      roles: ['admin']
    }
  ];

  // Filter items based on user role - strictly enforce role-based access
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  console.log(`Sidebar: User role is ${user.role}, showing ${filteredItems.length} navigation items`);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      "bg-gray-50 dark:bg-[#102030] min-h-screen p-4 border-r transition-all duration-300 flex flex-col relative",
      collapsed ? "w-20" : "w-64"
    )}>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 h-6 w-6 bg-white dark:bg-[#222] border rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-[#333]"
      >
        {collapsed ? 
          <ChevronRight className="h-4 w-4" /> : 
          <ChevronLeft className="h-4 w-4" />
        }
      </Button>
      
      <div className="space-y-1 mt-4">
        {filteredItems.map((item) => (
          <Button
            key={item.href}
            variant={location.pathname === item.href ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              location.pathname === item.href ? "bg-brand-orange hover:bg-brand-orange/90" : "",
              collapsed ? "px-2" : ""
            )}
            onClick={() => navigate(item.href)}
          >
            {item.icon}
            {!collapsed && <span className="ml-2">{item.label}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
