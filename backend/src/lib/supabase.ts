import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create a single supabase client for the entire app with fallback for development
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: any;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase configuration missing. Using mock client for development.');
  console.warn('   Required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
  
  // Create a mock Supabase client for development
  supabase = {
    auth: {
      getUser: async () => ({ 
        data: { user: null }, 
        error: { message: 'Mock Supabase - authentication disabled' } 
      }),
      signInWithPassword: async () => ({ 
        data: { user: null }, 
        error: { message: 'Mock Supabase - authentication disabled' } 
      }),
      signUp: async () => ({ 
        data: { user: null }, 
        error: { message: 'Mock Supabase - authentication disabled' } 
      }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
    }),
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized successfully');
}

export { supabase };