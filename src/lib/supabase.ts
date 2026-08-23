<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '[https://dhdymlzzwxxbuasqdako.supabase.co](https://dhdymlzzwxxbuasqdako.supabase.co)';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
=======
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://dhdymlzzwxxbuasqdako.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
>>>>>>> 1be58d519666f37e8c350e69423fd2a402901530
