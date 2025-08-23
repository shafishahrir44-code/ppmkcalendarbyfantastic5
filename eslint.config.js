import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  created_by: string;
  created_at: string;
}

export interface DatabaseComment {
  id: string;
  event_id: string;
  text: string;
  author: string;
  created_at: string;
}

export interface DatabaseEventRequest {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
