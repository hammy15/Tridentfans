// Quick Credentials Update Script
// Run this to easily update your Supabase credentials

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function updateCredentials() {
  console.log('🔑 TridentFans Credentials Setup\n');
  
  console.log('Get these from: https://supabase.com/dashboard → Your Project → Settings → API\n');
  
  const url = await question('Supabase Project URL (https://abc123.supabase.co): ');
  const anonKey = await question('\nSupabase Anon Key (starts with eyJ...): ');
  const serviceKey = await question('\nSupabase Service Role Key (longer key, starts with eyJ...): ');
  
  console.log('\n🤖 Optional: AI Bot Functionality');
  const anthropicKey = await question('Anthropic API Key (optional, press Enter to skip): ');
  
  console.log('\n📧 Optional: Email Notifications');
  const resendKey = await question('Resend API Key (optional, press Enter to skip): ');
  
  rl.close();

  // Read current .env.local
  let envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Update the values
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${url}`);
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
  envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
  
  if (anthropicKey.trim()) {
    envContent = envContent.replace(/ANTHROPIC_API_KEY=.*/, `ANTHROPIC_API_KEY=${anthropicKey}`);
  }
  
  if (resendKey.trim()) {
    envContent = envContent.replace(/RESEND_API_KEY=.*/, `RESEND_API_KEY=${resendKey}`);
  }
  
  // Write back to file
  fs.writeFileSync('.env.local', envContent);
  
  console.log('\n✅ Credentials updated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: node setup-database.js');
  console.log('2. Run: npm run dev');
  console.log('3. Visit: http://localhost:3000');
}

updateCredentials().catch(console.error);