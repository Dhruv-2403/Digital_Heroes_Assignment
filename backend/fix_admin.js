require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const email = "admin@digitalheroes.com";
  const password = "Admin@123";
  
  console.log("Generating new hash for Admin@123...");
  const newHash = await bcrypt.hash(password, 12);
  
  console.log("Updating database...");
  const { data, error } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('email', email)
      .select();

  if (error) {
     console.error("Supabase Update Error:", error);
     return;
  }
  
  console.log("Successfully fixed the Admin password in the database.");
  
  // Verify
  const valid = await bcrypt.compare(password, data[0].password_hash);
  console.log("Verification checks out?:", valid);
}
fix();
