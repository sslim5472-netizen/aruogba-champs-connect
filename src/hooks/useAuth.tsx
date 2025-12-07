import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  teamId: string | null;
  firstName: string | null;
  lastName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  teamId: null,
  firstName: null,
  lastName: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSigningOutRef = useRef(false); // Use a ref to persist across renders without causing re-renders

  const fetchUserProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles' as any) // Type assertion to fix TS error
      .select('first_name, last_name')
      .eq('id', userId)
      .single<{ first_name: string | null; last_name: string | null } | null>();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setFirstName(null);
      setLastName(null);
    } else if (profileData) {
      setFirstName(profileData.first_name);
      setLastName(profileData.last_name);
    } else {
      setFirstName(null);
      setLastName(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state change event:", _event, "Session:", session); // Debug log
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role, team_id')
            .eq('user_id', session.user.id)
            .single<{ role: string; team_id: string | null } | null>();
          
          if (roleError && roleError.code !== 'PGRST116') { // PGRST116 means no rows found
             console.error("Error fetching user role:", roleError);
          }

          if (roleData) {
            setUserRole(roleData.role);
            setTeamId(roleData.team_id);
          } else {
            setUserRole(null);
            setTeamId(null);
          }
          await fetchUserProfile(session.user.id);
        } else {
          // Explicitly clear all user-related state on SIGNED_OUT or no session
          setUserRole(null);
          setTeamId(null);
          setFirstName(null);
          setLastName(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session); // Debug log
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, team_id')
          .eq('user_id', session.user.id)
          .single<{ role: string; team_id: string | null } | null>();
        
         if (roleError && roleError.code !== 'PGRST116') { // PGRST116 means no rows found
             console.error("Error fetching user role on init:", roleError);
          }

        if (roleData) {
          setUserRole(roleData.role);
          setTeamId(roleData.team_id);
        }
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    if (error) setLoading(false);
    return { error };
  };

  const signOut = async () => {
    if (isSigningOutRef.current) {
      console.log("Sign out already in progress, ignoring redundant call.");
      return;
    }
    isSigningOutRef.current = true; // Set flag immediately

    console.log("Initiating sign out process...");
    setLoading(true);
    
    try {
      console.log("Calling supabase.auth.signOut()...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out from Supabase:", error);
        toast.error("Failed to sign out: " + error.message);
      } else {
        console.log("Successfully signed out from Supabase. Initiating page reload...");
        toast.success("Successfully logged out!");
        // Perform a full page reload to ensure all state is reset cleanly
        // This will cause the entire app to re-initialize, including the AuthProvider
        // and thus reset isSigningOutRef.current to false.
        window.location.assign('/');
      }
    } catch (err: any) {
      console.error("Unexpected error during sign out:", err);
      toast.error("An unexpected error occurred during logout.");
    } finally {
      // If for some reason window.location.assign doesn't happen (e.g., error before it),
      // we need to reset the flag to allow future sign-out attempts.
      // This check is a safeguard, as a successful window.location.assign will reset the entire app state.
      if (isSigningOutRef.current) {
         isSigningOutRef.current = false;
      }
      setUser(null);
      setSession(null);
      setUserRole(null);
      setTeamId(null);
      setFirstName(null);
      setLastName(null);
      setLoading(false);
      console.log("Sign out process finalized in hook (before potential reload).");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, teamId, firstName, lastName, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};