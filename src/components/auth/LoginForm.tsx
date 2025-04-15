
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    
    try {
      if (isSigningUp) {
        // Handle sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              // Default role for new users is cashier
              role: 'cashier'
            }
          }
        });
        
        if (error) throw new Error(error.message);
        
        toast({
          title: "Account created",
          description: "Your account has been created successfully. You can now log in.",
        });
        
        setIsSigningUp(false);
      } else {
        // Handle login - only validate credentials, don't manually set role
        console.log(`Attempting to login with email: ${email}`);
        
        // Important: When logging in, we don't specify a role - we use the stored role
        await login(email, password);
        
        // Navigate after successful login
        navigate('/dashboard');
      }
    } catch (error) {
      let message = "An error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      
      console.error("Login/signup error:", message);
      
      toast({
        title: isSigningUp ? "Sign up failed" : "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Swift Bites</CardTitle>
        <CardDescription className="text-center">
          {isSigningUp ? "Create a new account" : "Enter your credentials to access the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {isSigningUp && (
            <div className="text-sm text-muted-foreground">
              New accounts will be assigned the Cashier role by default.
              Only Admin can change roles after creation.
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full bg-brand-orange hover:bg-brand-orange/90"
            disabled={isLoading}
          >
            {isLoading 
              ? (isSigningUp ? "Creating account..." : "Logging in...")
              : (isSigningUp ? "Create Account" : "Login")
            }
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          variant="link" 
          className="text-sm"
          onClick={() => setIsSigningUp(!isSigningUp)}
        >
          {isSigningUp 
            ? "Already have an account? Log in" 
            : "Don't have an account? Sign up"
          }
        </Button>
        {!isSigningUp && (
          <div className="text-sm text-muted-foreground text-center">
            <p>Demo accounts:</p>
            <p>admin@gmail.com | manager@gmail.com | cashier@gmail.com</p>
            <p>Password: 123456</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
