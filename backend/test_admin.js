require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking database...");
  const { data, error } = await supabase.from('users').select('*').eq('email', 'admin@digitalheroes.com');
  
  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  console.log("Users found with that email:", data.length);
  
  if (data.length > 0) {
    console.log("User role:", data[0].role);
    const valid = await bcrypt.compare('Admin@123', data[0].password_hash);
    console.log("Is 'Admin@123' the correct password match?:", valid);
  } else {
    console.log("❌ The admin user does not exist in the database! Did you run schema.sql?");
  }
}

test();
