const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixConstraint() {
  try {
    console.log('🔧 Fixing certificate status constraint...');
    
    console.log('✅ Please run these SQL commands in Supabase SQL Editor:');
    console.log('');
    console.log('1. Drop existing constraint:');
    console.log('ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;');
    console.log('');
    console.log('2. Create new constraint with all required status values:');
    console.log(`ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check CHECK (
  status IN (
    'pending', 'submitted', 'staff_review', 'processing', 'secretary_approval',
    'captain_approval', 'physical_inspection', 'Treasury', 'oic_review',
    'approved', 'ready', 'ready_for_pickup', 'released', 'rejected',
    'returned', 'completed', 'cancelled'
  )
);`);
    
    console.log('');
    console.log('3. Verify the constraint:');
    console.log(`SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';`);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixConstraint();