import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types"; // Import Database type

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

  // Define the expected type for the data returned by the profile select query
  type ProfileSelectData = {
    first_name: string | null;
    last_name: string | null;
  } | null; // It can be null if .single() finds no record

  const fetchUserProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles' as keyof Database['public']['Tables'])
      .select('first_name, last_name')
      .eq('id', userId)
      .single<ProfileSelectData>(); // Explicitly type the single() return data

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setFirstName(null);
      setLastName(null);
    } else if (profileData) {
      // profileData is now correctly inferred as { first_name: string | null, last_name: string | null }
      setFirstName(profileData.first_name);
      setLastName(profileData.last_name);
    } else {
      // Handle case where no profile is found (profileData is null, but no error)
      setFirstName(null);
      setLastName(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
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

          // Fetch user profile (first_name, last_name)
          await fetchUserProfile(session.user.id);

        } else {
          setUserRole(null);
          setTeamId(null);
          setFirstName(null);
          setLastName(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session on initial load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, team_id')
          .eq('user_id', session.user.id)
          .single();
        
        if (roleData) {
          setUserRole(roleData.role);
          setTeamId(roleData.team_id);
        }

        // Fetch user profile (first_name, last_name)
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
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
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
    // Removed localStorage.clear() to prevent interference with Supabase session management.
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, teamId, firstName, lastName, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};