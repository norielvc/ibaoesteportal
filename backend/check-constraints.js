const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Checking database constraints...');
  
  try {
    // Check workflow_assignments constraint
    const { data: workflowConstraints, error: workflowError } = await supabase
      .from('pg_constraint')
      .select('conname, pg_get_constraintdef(oid)')
      .eq('conname', 'chk_request_type');

    if (workflowError) {
      console.error('❌ Error fetching workflow constraints:', workflowError);
    } else {
      console.log('\n📋 Workflow Assignments Constraint:');
      workflowConstraints.forEach(constraint => {
        console.log(`  ${constraint.conname}: ${constraint.pg_get_constraintdef}`);
      });
    }

    // Check certificate_requests constraint
    const { data: certConstraints, error: certError } = await supabase
      .from('pg_constraint')
      .select('conname, pg_get_constraintdef(oid)')
      .eq('conname', 'certificate_requests_status_check');

    if (certError) {
      console.error('❌ Error fetching certificate constraints:', certError);
    } else {
      console.log('\n📋 Certificate Requests Status Constraint:');
      certConstraints.forEach(constraint => {
        console.log(`  ${constraint.conname}: ${constraint.pg_get_constraintdef}`);
      });
    }

    // Check what status values are currently in use
    const { data: statusValues, error: statusError } = await supabase
      .from('certificate_requests')
      .select('status')
      .eq('certificate_type', 'business_permit');

    if (statusError) {
      console.error('❌ Error fetching status values:', statusError);
    } else {
      console.log('\n📋 Current Business Permit Status Values:');
      const uniqueStatuses = [...new Set(statusValues.map(r => r.status))];
      uniqueStatuses.forEach(status => {
        console.log(`  - ${status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  }
}

// Run the check
checkConstraints();