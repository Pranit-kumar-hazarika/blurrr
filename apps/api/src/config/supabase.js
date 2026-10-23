const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const adminSupabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Use this only to validate a user's access token with Supabase Auth.
const authSupabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { adminSupabase, authSupabase };
