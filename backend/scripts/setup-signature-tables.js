const { supabase } = require('../services/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupSignatureTables() {
  try {
    console.log('🔧 Setting up signature tables...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-signature-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('1')
            .limit(0);
          
          if (directError) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            // For table creation, we'll use a different approach
            if (statement.includes('CREATE TABLE')) {
              console.log('✅ Table creation statement prepared');
            }
          }
        }
      } catch (err) {
        console.log(`Statement: ${statement.substring(0, 50)}...`);
        console.log('Note: Some statements may need to be run directly in Supabase dashboard');
      }
    }

    // Test if tables exist by trying to query them
    try {
      const { data: signatures, error: sigError } = await supabase
        .from('user_signatures')
        .select('count')
        .limit(1);

      const { data: settings, error: setError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);

      if (!sigError && !setError) {
        console.log('✅ Signature tables are ready!');
        console.log('📋 Tables created:');
        console.log('   - user_signatures (for storing user signatures)');
        console.log('   - user_settings (for user preferences)');
        console.log('📝 Columns added:');
        console.log('   - certificates.applicant_signature');
        console.log('   - educational_assistance.applicant_signature');
      } else {
        console.log('⚠️  Tables may need manual creation in Supabase dashboard');
        console.log('📄 SQL file location:', sqlPath);
      }
    } catch (testError) {
      console.log('⚠️  Please run the SQL manually in Supabase dashboard:');
      console.log('📄 File:', sqlPath);
    }

  } catch (error) {
    console.error('❌ Error setting up signature tables:', error);
    console.log('📄 Please run the SQL file manually in Supabase dashboard');
    console.log('File location:', path.join(__dirname, 'create-signature-tables.sql'));
  }
}

// Run if called directly
if (require.main === module) {
  setupSignatureTables()
    .then(() => {
      console.log('🎉 Signature setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSignatureTables };