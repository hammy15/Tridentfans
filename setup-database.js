// Database Setup Script for TridentFans
// Run this after you have your Supabase credentials configured

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up TridentFans database...\n');

  // Check if environment is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your_') || serviceKey.includes('your_')) {
    console.error('❌ Environment not configured!');
    console.log('Please update .env.local with your actual Supabase credentials first.');
    console.log('Get them from: https://supabase.com/dashboard → Settings → API');
    return;
  }

  console.log('✅ Environment configured');
  console.log('🔗 Connecting to Supabase...');

  const supabase = createClient(supabaseUrl, serviceKey);

  // Test connection
  try {
    const { data, error } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ Connected to Supabase successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return;
  }

  // Get migration files
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  let migrationFiles;
  
  try {
    migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order
  } catch (error) {
    console.error('❌ Could not read migrations directory');
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration files`);

  // Run each migration
  for (const file of migrationFiles) {
    console.log(`⚡ Running migration: ${file}`);
    
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split by semicolon and run each statement
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
          if (error && !error.message.includes('already exists')) {
            console.log(`⚠️  Warning in ${file}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Completed: ${file}`);
    } catch (error) {
      console.log(`⚠️  Error in ${file}: ${error.message}`);
    }
  }

  console.log('\n🎉 Database setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. Test signup at: http://localhost:3000/auth/signup');
  console.log('4. Access admin at: http://localhost:3000/admin');
}

setupDatabase().catch(console.error);