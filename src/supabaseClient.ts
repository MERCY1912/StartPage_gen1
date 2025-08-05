import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if Supabase is not configured
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-url') || supabaseAnonKey.includes('your-anon-key')) {
  console.warn('Supabase not configured, using mock client');
  // Create a mock Supabase client for development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase не настроен' } }),
      signUp: () => Promise.resolve({ error: { message: 'Supabase не настроен' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { code: 'MOCK_ERROR', message: 'Supabase не настроен' } })
          }),
          maybeSingle: () => Promise.resolve({ data: null, error: { code: 'MOCK_ERROR', message: 'Supabase не настроен' } })
        }),
        maybeSingle: () => Promise.resolve({ data: null, error: { code: 'MOCK_ERROR', message: 'Supabase не настроен' } })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase не настроен' } })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: { message: 'Supabase не настроен' } })
      })
    })
  };
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
}

export { supabase };
export type Database = {
  public: {
    Tables: {
      user_usage: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          request_date: string;
          request_count: number;
          is_premium: boolean;
          premium_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          request_date: string;
          request_count?: number;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          request_date?: string;
          request_count?: number;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};