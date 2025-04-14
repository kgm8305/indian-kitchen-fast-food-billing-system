
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Coffee, 
  ShoppingCart, 
  BarChart, 
  MenuSquare
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      roles: ['admin']
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
      roles: ['admin', 'manager'] 
    },
  ];

  // Filter items based on user role
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="bg-gray-50 w-64 min-h-screen p-4 border-r">
      <div className="space-y-1">
        {filteredItems.map((item) => (
          <Button
            key={item.href}
            variant={location.pathname === item.href ? "default" : "ghost"}
            className={`w-full justify-start ${
              location.pathname === item.href 
                ? "bg-brand-orange hover:bg-brand-orange/90" 
                : ""
            }`}
            onClick={() => navigate(item.href)}
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
