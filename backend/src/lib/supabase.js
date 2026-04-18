const { createClient } = require('@supabase/supabase-js');

// Use service role key for backend operations (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
