// test-connection.js - Test Supabase connection
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing TridentFans Supabase Connection\n');

console.log('📋 Current Configuration:');
console.log(`URL: ${url}`);
console.log(`Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : 'MISSING'}`);
console.log(`Service Key: ${serviceKey && !serviceKey.includes('PLACEHOLDER') ? serviceKey.substring(0, 20) + '...' : 'MISSING'}`);

if (!url || !anonKey || !serviceKey || serviceKey.includes('PLACEHOLDER')) {
  console.log('\n❌ Missing credentials:');
  if (!url) console.log('   - Project URL');
  if (!anonKey || anonKey.includes('PLACEHOLDER')) console.log('   - Anon public key');
  if (!serviceKey || serviceKey.includes('PLACEHOLDER')) console.log('   - Service role key');
  
  console.log('\n📋 Please provide these from your Supabase dashboard:');
  console.log('   Settings → API → Copy both keys');
  console.log('   Anon key: eyJ... (long JWT token)');
  console.log('   Service role key: eyJ... (even longer JWT token)');
} else {
  console.log('\n✅ All credentials present - ready to test connection!');
  
  // Test basic connection
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);
  
  supabase.from('information_schema.tables').select('*').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful!');
        console.log('🚀 Ready to run: node setup-database.js');
      }
    });
}

module.exports = { url, anonKey, serviceKey };