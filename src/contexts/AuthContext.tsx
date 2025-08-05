import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session ? 'found' : 'not found');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'session present' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables missing:', {
          url: import.meta.env.VITE_SUPABASE_URL ? 'present' : 'missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
        });
        return { error: { message: 'Supabase не настроен. Обратитесь к администратору.' } as any };
      }

      console.log('Attempting sign in with:', { email, supabaseUrl: import.meta.env.VITE_SUPABASE_URL });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase sign in error:', error);
      } else {
        console.log('Sign in successful');
      }
      
      return { error };
    } catch (err) {
      console.error('Authentication error:', err);
      return { error: { message: 'Ошибка подключения к серверу. Попробуйте позже.' } as any };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables missing for signup');
        return { error: { message: 'Supabase не настроен. Обратитесь к администратору.' } as any };
      }

      console.log('Attempting sign up with:', { email });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase sign up error:', error);
      } else {
        console.log('Sign up successful');
      }
      
      return { error };
    } catch (err) {
      console.error('Registration error:', err);
      return { error: { message: 'Ошибка подключения к серверу. Попробуйте позже.' } as any };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.warn('Sign out error:', err);
      return { error: { message: 'Ошибка при выходе из системы.' } as any };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};