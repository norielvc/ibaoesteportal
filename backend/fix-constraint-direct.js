const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the connection string approach
const { Client } = require('pg');

async function fixConstraint() {
  console.log('🔧 Fixing workflow_history constraint\n');
  
  // Extract connection details from Supabase URL
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];
  
  console.log('⚠️  Direct PostgreSQL connection required.');
  console.log('   Please run this SQL in your Supabase SQL Editor:\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`-- Fix workflow_history constraint to allow business_permit

ALTER TABLE workflow_history 
DROP CONSTRAINT IF EXISTS chk_history_request_type;

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
));

-- Also fix workflow_assignments constraint
ALTER TABLE workflow_assignments 
DROP CONSTRAINT IF EXISTS chk_request_type;

ALTER TABLE workflow_assignments 
ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit'
));`);
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('📍 Steps:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Paste the SQL above');
  console.log('   4. Click "Run"');
  console.log('\n✅ After running, comments will be saved correctly!');
}

fixConstraint().catch(console.error);
