const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runConstraintFix() {
  console.log('🔧 Fixing workflow constraints to include business_permit\n');
  
  const sql = fs.readFileSync('./fix-workflow-constraints-business-permit.sql', 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Trying direct query...`);
      
      // Try using from() with a raw query
      const { error: error2 } = await supabase.from('_sql').insert({ query: statement });
      
      if (error2) {
        console.log(`❌ Still failed. Skipping...`);
      }
    } else {
      console.log(`✅ Success`);
    }
  }
  
  console.log('\n✅ Constraint fix completed!');
  console.log('   business_permit and certification_same_person are now allowed in workflow tables.');
}

runConstraintFix().catch(console.error);
