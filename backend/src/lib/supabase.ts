import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const isDevelopment = process.env.NODE_ENV !== 'production';

let supabase: any;

if (!supabaseUrl || !supabaseKey) {
  if (isDevelopment) {
    console.warn('⚠️  Supabase configuration missing. Using mock client for development.');
    console.warn('   To use Supabase authentication:');
    console.warn('   1. Set SUPABASE_URL in your .env file');
    console.warn('   2. Set SUPABASE_ANON_KEY in your .env file');
    
    // Create a mock Supabase client for development
    supabase = {
      auth: {
        getUser: async () => ({ 
          data: { user: null }, 
          error: { message: 'Mock Supabase - authentication disabled in development' } 
        }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Mock Supabase - authentication disabled in development' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Mock Supabase - authentication disabled in development' } 
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
    throw new Error('Supabase configuration required in production. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
    throw error;
  }
}

export { supabase };
export const isSupabaseMockMode = !supabaseUrl || !supabaseKey;