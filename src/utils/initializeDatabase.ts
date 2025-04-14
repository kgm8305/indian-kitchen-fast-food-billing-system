
import { supabase } from '@/integrations/supabase/client';

export const seedDemoUsers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('seed-users');
    
    if (error) {
      console.error('Error seeding demo users:', error);
    } else {
      console.log('Demo users created successfully:', data);
    }
  } catch (error) {
    console.error('Error invoking edge function:', error);
  }
};
