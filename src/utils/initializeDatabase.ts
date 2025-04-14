
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const seedDemoUsers = async () => {
  try {
    console.log("Attempting to seed demo users...");
    
    // Call the edge function to create demo users
    const { data, error } = await supabase.functions.invoke('seed-users');
    
    if (error) {
      console.error('Error seeding demo users:', error);
      toast({
        title: "Error initializing data",
        description: "Failed to create demo users. Please try again.",
        variant: "destructive",
      });
    } else {
      console.log('Demo users created successfully:', data);
      
      // Show success message only in development
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: "Database initialized",
          description: "Demo users created: admin@gmail.com, manager@gmail.com, cashier@gmail.com (password: 123456)",
        });
      }
    }
  } catch (error) {
    console.error('Error invoking edge function:', error);
    toast({
      title: "Initialization error",
      description: "Failed to connect to server. Please try again later.",
      variant: "destructive",
    });
  }
};
