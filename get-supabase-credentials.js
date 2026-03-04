// get-supabase-credentials.js
// Simple script to help get Supabase credentials from the dashboard

console.log('🔍 TridentFans Supabase Setup Helper\n');

console.log('I can see the TridentFans project exists in your Supabase dashboard, but need the credentials.');
console.log('Here are the two ways to get them:\n');

console.log('📋 METHOD 1: From Supabase Dashboard');
console.log('1. Go to: https://supabase.com/dashboard/projects');
console.log('2. Click on the "Tridentfans" project');
console.log('3. Go to Settings → API');
console.log('4. Copy these values:');
console.log('   - Project URL (https://[project-id].supabase.co)');
console.log('   - anon public key (starts with eyJ...)');
console.log('   - service_role key (longer key, starts with eyJ...)\n');

console.log('📋 METHOD 2: Extract from Browser');
console.log('If you can access the project settings, paste the credentials here:');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getCredentials() {
  console.log('🔗 Enter your TridentFans Supabase credentials:');
  
  const url = await question('Project URL (https://xxx.supabase.co): ');
  if (url && url.includes('supabase.co')) {
    const anonKey = await question('Anon Key (starts with eyJ...): ');
    const serviceKey = await question('Service Role Key (starts with eyJ...): ');
    
    if (anonKey && serviceKey && anonKey.startsWith('eyJ') && serviceKey.startsWith('eyJ')) {
      // Update .env.local file
      const fs = require('fs');
      let envContent = fs.readFileSync('.env.local', 'utf8');
      
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${url}`);
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
      envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
      
      fs.writeFileSync('.env.local', envContent);
      
      console.log('\n✅ Credentials updated successfully!');
      console.log('🚀 Now run: npm run dev');
      console.log('🌐 Then visit: http://localhost:3000');
      
    } else {
      console.log('\n❌ Invalid credentials format. Keys should start with "eyJ"');
    }
  } else {
    console.log('\n❌ Invalid URL format. Should be like: https://abc123.supabase.co');
  }
  
  rl.close();
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Auto-run if called directly
if (require.main === module) {
  getCredentials();
}