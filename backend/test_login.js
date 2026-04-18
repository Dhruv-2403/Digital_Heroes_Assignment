require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = "admin@digitalheroes.com";
  const password = "Admin@123";
  
  console.log("Querying Supabase...");
  const { data: user, error } = await supabase
      .from('users')
      .select('*, subscriptions(*)')
      .eq('email', email)
      .single();

  if (error) {
     console.error("Supabase Query Error:", error);
     return;
  }
  
  if (!user) {
     console.error("User not found!");
     return;
  }
  
  console.log("User found:", user.email, "Role:", user.role);
  
  const valid = await bcrypt.compare(password, user.password_hash);
  console.log("Does Admin@123 match the hash?:", valid);
}
test();
