
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LockKeyhole } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto">
          <LockKeyhole className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page. Please contact an administrator or switch to an account with appropriate permissions.
        </p>
        <div className="pt-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="mx-auto"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
