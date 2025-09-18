import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string; // Adicionado o campo role
  subscription_status?: string; // Adicionado o campo subscription_status
}

interface SessionContextType {
  session: Session | null;
  user: (User & UserProfile) | null; // Combinar User do Supabase com UserProfile
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & UserProfile) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (supabaseUser: User) => {
    console.log('Fetching user profile for:', supabaseUser.id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, role, subscription_status')
      .eq('id', supabaseUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
      console.error('Error fetching user profile:', error);
      return { ...supabaseUser, role: 'user', subscription_status: 'inactive' }; // Default role on error
    }
    console.log('User profile fetched:', profile);
    return {
      ...supabaseUser,
      ...profile,
      role: profile?.role || 'user', // Default to 'user' if not set
      subscription_status: profile?.subscription_status || 'inactive', // Default to 'inactive'
    };
  };

  useEffect(() => {
    console.log('SessionContext useEffect triggered.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('onAuthStateChange event:', event, 'session:', currentSession);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const userWithProfile = await fetchUserProfile(currentSession.user);
            setSession(currentSession);
            setUser(userWithProfile);
            console.log('User set from onAuthStateChange:', userWithProfile);
            if (location.pathname === '/login') {
              navigate('/');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log('User signed out.');
          navigate('/login');
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      console.log('Initial getSession result:', initialSession);
      if (initialSession?.user) {
        const userWithProfile = await fetchUserProfile(initialSession.user);
        setSession(initialSession);
        setUser(userWithProfile);
        console.log('User set from initial getSession:', userWithProfile);
      } else {
        setSession(null);
        setUser(null);
        console.log('No initial session found.');
      }
      setIsLoading(false);
      if (!initialSession && location.pathname !== '/login') {
        navigate('/login');
      } else if (initialSession && location.pathname === '/login') {
        navigate('/');
      }
    });

    return () => {
      console.log('SessionContext useEffect cleanup.');
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};