import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types"; // Import Database type
import { toast } from "sonner"; // Import toast for user feedback

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

  type ProfileSelectData = {
    first_name: string | null;
    last_name: string | null;
  } | null;

  const fetchUserProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles' as keyof Database['public']['Tables'])
      .select('first_name, last_name')
      .eq('id', userId)
      .single<ProfileSelectData>();

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
      async (event, session) => {
        console.log("Auth state change event:", event, "Session:", session); // Debug log
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role, team_id')
            .eq('user_id', session.user.id)
            .single();
          
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
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, team_id')
          .eq('user_id', session.user.id)
          .single();
        
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
    setLoading(true); // Set loading true on sign in attempt
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoading(false); // If error, stop loading
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true); // Set loading true on sign up attempt
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
    if (error) setLoading(false); // If error, stop loading
    return { error };
  };

  const signOut = async () => {
    console.log("Attempting to sign out..."); // Debug log
    setLoading(true); // Indicate loading during sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out: " + error.message); // Provide user feedback
    } else {
      toast.success("Successfully logged out!"); // Provide user feedback
    }
    // Explicitly clear local state after Supabase sign out
    // This will also trigger the onAuthStateChange listener with SIGNED_OUT event
    setUser(null);
    setSession(null);
    setUserRole(null);
    setTeamId(null);
    setFirstName(null);
    setLastName(null);
    setLoading(false); // Set loading to false after sign out attempt
    console.log("Sign out process completed. User state cleared."); // Debug log
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, teamId, firstName, lastName, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};