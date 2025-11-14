import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn } from "lucide-react";
import { toast } from "sonner";
import aruogbaLogo from "@/assets/aruogba-logo.jpg";

// Simple password-only auth (for demo/internal use)
const ADMIN_PASSWORD = "aruogba2025";

const Auth = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== ADMIN_PASSWORD) {
      toast.error("Incorrect password");
      return;
    }
    
    setLoading(true);

    try {
      const adminEmail = "admin@aruogba.fc";
      
      // Try to sign in first
      let { error: signInError } = await signIn(adminEmail, password);
      
      // If user doesn't exist, sign them up first
      if (signInError?.message?.includes("Invalid login credentials")) {
        toast.info("Creating admin account...");
        
        // Sign up the admin user
        const { error: signUpError } = await signUp(adminEmail, password);
        
        if (signUpError) {
          toast.error("Failed to create admin account");
          return;
        }
        
        // Now try signing in again
        const { error: retryError } = await signIn(adminEmail, password);
        if (retryError) {
          toast.error("Authentication failed. Please try again.");
        } else {
          toast.success("Admin account created and logged in!");
          navigate("/admin");
        }
      } else if (signInError) {
        toast.error("Authentication failed. Please try again.");
      } else {
        toast.success("Successfully logged in!");
        navigate("/admin");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 rounded-xl animate-fade-in">
          <div className="text-center mb-8">
            <img src={aruogbaLogo} alt="Aruogba FC" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-heading gradient-text mb-2">
              Admin Access
            </h1>
            <p className="text-muted-foreground">
              Enter password to access the admin panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter admin password"
                autoFocus
              />
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
                  <LogIn className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Password: aruogba2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;