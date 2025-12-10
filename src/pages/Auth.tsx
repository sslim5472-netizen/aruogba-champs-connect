import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import aruogbaLogo from "@/assets/aruogba-logo.jpg";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Updated schema to only allow Gmail addresses and include first/last names
const authSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .refine(email => email.endsWith('@gmail.com'), 'Only Gmail addresses are allowed for registration'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
}).superRefine((data, ctx) => {
  if (data.email.endsWith('@gmail.com') && data.firstName === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'First name is required for registration',
      path: ['firstName'],
    });
  }
  if (data.email.endsWith('@gmail.com') && data.lastName === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Last name is required for registration',
      path: ['lastName'],
    });
  }
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate input
      const validationData = isSignUp ? { email, password, firstName, lastName } : { email, password };
      const result = authSchema.safeParse(validationData);
      
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Sign up flow
        const { error: signUpError } = await signUp(email, password, firstName, lastName);
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            toast.error("This email is already registered. Please login instead.");
          } else {
            toast.error(signUpError.message || "Failed to create account");
          }
        } else {
          toast.success("Account created successfully! Please check your Gmail for verification.");
          navigate("/");
        }
      } else {
        // Sign in flow
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(signInError.message || "Failed to sign in");
          }
        } else {
          toast.success("Successfully logged in!");
          navigate("/");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 rounded-xl animate-fade-in">
          <div className="text-center mb-8">
            <img src={aruogbaLogo} alt="Aruogba League" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-heading gradient-text mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp 
                ? "Sign up with your Gmail to vote for Player of the Match" 
                : "Sign in to continue voting"}
            </p>
          </div>
          
          {isSignUp && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-300 text-center">
                Only Gmail addresses are accepted for registration
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required={isSignUp}
                    className="mt-1" 
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required={isSignUp}
                    className="mt-1" 
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="mt-1" 
                placeholder="your.email@gmail.com"
                autoComplete="email"
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Only Gmail addresses are allowed for registration
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="mt-1" 
                placeholder="Min. 8 characters"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={loading}
            >
              {loading ? (
                "Please wait..."
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Sign in with Google
          </Button>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              type="button"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;