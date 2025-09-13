import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate } from 'react-router-dom';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          if (currentSession && location.pathname === '/login') {
            navigate('/'); // Redirect authenticated users from login page
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/login'); // Redirect unauthenticated users to login page
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoading(false);
      if (!initialSession && location.pathname !== '/login') {
        navigate('/login');
      } else if (initialSession && location.pathname === '/login') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
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