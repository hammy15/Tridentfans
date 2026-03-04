// Simple Supabase connection test
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
  console.log('🔍 Testing Supabase Connection\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`URL: ${url}`);
  console.log(`Service Key: ${serviceKey ? 'Present' : 'Missing'}\n`);
  
  try {
    const supabase = createClient(url, serviceKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('pg_tables').select('*').limit(1);
    
    if (error) {
      console.log('❌ Connection error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Found tables in database');
      console.log('\n🚀 Supabase is working - ready to set up TridentFans!');
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testSupabase();