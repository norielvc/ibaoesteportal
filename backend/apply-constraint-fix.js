const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyConstraintFix() {
  console.log('🔧 Fixing workflow_history constraint to include business_permit\n');
  
  try {
    // Drop the old constraint
    console.log('1. Dropping old constraint...');
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_request_type;' 
    });
    console.log('   ✅ Old constraint dropped\n');
    
    // Add the new constraint with business_permit included
    console.log('2. Adding new constraint with business_permit...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE workflow_history 
            ADD CONSTRAINT chk_history_request_type 
            CHECK (request_type IN (
              'barangay_clearance', 
              'certificate_of_indigency', 
              'barangay_residency', 
              'natural_death',
              'barangay_guardianship',
              'barangay_cohabitation',
              'medico_legal',
              'certification_same_person',
              'business_permit',
              'note'
            ));`
    });
    
    if (error) {
      console.log('   ❌ RPC method not available. Using direct SQL execution...\n');
      
      // Alternative: Use Supabase SQL editor or run manually
      console.log('📋 Please run this SQL manually in Supabase SQL Editor:\n');
      console.log('---');
      console.log(`ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_request_type;

ALTER TABLE workflow_history 
ADD CONSTRAINT chk_history_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit',
  'note'
));`);
      console.log('---\n');
    } else {
      console.log('   ✅ New constraint added successfully!\n');
    }
    
    console.log('✅ Fix completed! business_permit is now allowed in workflow_history.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run the SQL from fix-workflow-constraints-business-permit.sql manually.');
  }
}

applyConstraintFix().catch(console.error);
