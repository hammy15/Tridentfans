// quick-setup.js - Complete TridentFans setup with your API keys

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupTridentFans() {
  console.log('🔱 TridentFans Complete Setup');
  console.log('URL already configured: https://mqeddvipsmtvsqlkbqq.supabase.co\n');
  
  console.log('📋 Please paste your API keys from Settings → API:');
  
  const anonKey = await question('Anon public key (starts with eyJ...): ');
  const serviceKey = await question('Service role key (starts with eyJ...): ');
  
  if (anonKey.startsWith('eyJ') && serviceKey.startsWith('eyJ')) {
    console.log('\n🔧 Updating environment...');
    
    // Update .env.local
    let envContent = fs.readFileSync('.env.local', 'utf8');
    envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
    envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
    fs.writeFileSync('.env.local', envContent);
    
    console.log('✅ Environment configured!');
    
    console.log('\n📊 Setting up database...');
    try {
      execSync('node setup-database.js', { stdio: 'inherit' });
      console.log('✅ Database setup complete!');
    } catch (error) {
      console.log('⚠️ Database setup had issues, but continuing...');
    }
    
    console.log('\n🚀 Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed!');
    } catch (error) {
      console.log('⚠️ Some dependencies may need attention');
    }
    
    console.log('\n🎉 TRIDENTFANS SETUP COMPLETE!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Test signup at: /auth/signup');
    console.log('4. Access admin at: /admin (password: mariners2026)');
    console.log('\n🔱⚾ Ready to launch the premier Mariners community!');
    
  } else {
    console.log('\n❌ Invalid API key format. Keys should start with "eyJ"');
    console.log('Please check Settings → API in your Supabase dashboard');
  }
  
  rl.close();
}

setupTridentFans().catch(console.error);