const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConstraint() {
  console.log('🔧 Fixing workflow_assignments constraint to include business_permit...');
  
  try {
    // Drop the existing constraint
    const dropConstraintSQL = `
      ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: dropConstraintSQL 
    });
    
    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return;
    }
    
    console.log('✅ Dropped old constraint');
    
    // Create new constraint with business_permit included
    const createConstraintSQL = `
      ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type CHECK (
        request_type IN (
          'barangay_clearance',
          'certificate_of_indigency', 
          'barangay_residency',
          'medico_legal',
          'business_permit',
          'natural_death',
          'barangay_guardianship',
          'certification_same_person',
          'barangay_cohabitation'
        )
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createConstraintSQL 
    });
    
    if (createError) {
      console.error('❌ Error creating new constraint:', createError);
      return;
    }
    
    console.log('✅ Created new constraint with business_permit included');
    
  } catch (error) {
    console.error('❌ Error fixing constraint:', error);
  }
}

// Run the fix
fixConstraint();