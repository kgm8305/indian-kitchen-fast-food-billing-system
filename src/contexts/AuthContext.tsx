
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user profile from the database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      
      // Add cache-busting parameter to avoid potential caching issues
      const timestamp = new Date().getTime();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
        
      if (profile) {
        console.log("Found profile with role:", profile.role);
        return profile;
      } else {
        console.log("No profile found for user:", userId);
        return null;
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  };

  // Function to refresh user profile (can be called when role changes)
  const refreshUserProfile = async () => {
    if (!user?.id) {
      console.log("No user to refresh profile for");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Refreshing user profile for:", user.id);
      
      // Force a fresh fetch from the database without caching
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error refreshing profile:", error);
        return;
      }
      
      if (profile) {
        console.log("Profile refreshed, new role:", profile.role);
        
        // Create a new user object to trigger state updates
        const updatedUser = {
          id: user.id,
          email: user.email,
          role: profile.role as UserRole,
        };
        
        // Check if role actually changed
        const roleChanged = user.role !== profile.role;
        
        console.log(`Role ${roleChanged ? 'changed' : 'unchanged'}, setting user with role:`, profile.role);
        
        // Always set the user to trigger a re-render
        setUser(updatedUser);
        
        // Notify user of role change if different
        if (roleChanged) {
          toast({
            title: "Role Updated",
            description: `Your role has been updated to ${profile.role}`,
          });
        }
      } else {
        console.error("No profile found during refresh");
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
          const profile = await fetchUserProfile(session.user.id);
            
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: profile.role as UserRole,
            });
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
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          // Delay profile fetching slightly to ensure database is updated
          setTimeout(async () => {
            try {
              // Fetch user profile data when signed in
              const profile = await fetchUserProfile(session.user.id);
                
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
            } catch (err) {
              console.error("Profile fetch error:", err);
            } finally {
              setIsLoading(false);
            }
          }, 500);
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

  const login = async (email: string, password: string) => {
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

      // Always fetch the latest profile data directly from the database
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
      
      // Set user with the role from their profile
      const userWithRole = {
        id: data.user.id,
        email: data.user.email || '',
        role: profile.role as UserRole,
      };
      
      setUser(userWithRole);
      
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
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      refreshUserProfile 
    }}>
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
