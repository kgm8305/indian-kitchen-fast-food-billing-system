
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on page load
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Found existing session:", session.user.id);
          // Fetch the user profile to get their role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
          }
            
          if (profile) {
            console.log("Found profile with role:", profile.role);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: profile.role as UserRole,
            });
          } else {
            console.log("No profile found for user:", session.user.id);
          }
        } else {
          console.log("No active session found");
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          // Only fetch user profile when needed
          setTimeout(async () => {
            try {
              // Fetch user profile data when signed in
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (error) {
                console.error("Error fetching profile on auth change:", error);
              }
                
              if (profile) {
                console.log("Setting user with role:", profile.role);
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  role: profile.role as UserRole,
                });
              } else {
                console.log("No profile found after sign-in");
              }
              
              setIsLoading(false);
            } catch (err) {
              console.error("Profile fetch error:", err);
              setIsLoading(false);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    console.log(`Login attempt with ${email}`);
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw new Error(error.message);
      }
      
      if (!data.user) {
        console.error("No user returned from authentication");
        throw new Error('No user returned from authentication');
      }

      console.log("Authentication successful, user:", data.user.id);

      // Fetch the user's profile to get their correct role from the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error(profileError.message);
      }
      
      if (!profile) {
        console.error("No profile found for user");
        throw new Error('No profile found for user');
      }
      
      // Set user with the role from their profile - not from login parameter
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        role: profile.role as UserRole,
      });
      
      console.log("User logged in with role:", profile.role);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
