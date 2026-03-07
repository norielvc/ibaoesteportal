const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyBusinessPermitAssignments() {
  console.log('🔍 Verifying Business Permit Workflow Assignments...');
  
  try {
    // Get all business permit requests with their assignments
    const { data: requests, error } = await supabase
      .from('certificate_requests')
      .select(`
        id,
        reference_number,
        status,
        certificate_type,
        workflow_assignments!inner(
          id,
          step_id,
          step_name,
          status,
          assigned_user_id,
          users(first_name, last_name, email)
        )
      `)
      .eq('certificate_type', 'business_permit');

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    console.log(`📋 Found ${requests.length} business permit requests with assignments:`);
    
    requests.forEach(request => {
      console.log(`\n📄 ${request.reference_number} (Status: ${request.status})`);
      request.workflow_assignments.forEach(assignment => {
        const user = assignment.users;
        console.log(`  └─ Step ${assignment.step_id}: ${assignment.step_name}`);
        console.log(`     Assigned to: ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`     Assignment Status: ${assignment.status}`);
      });
    });

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error verifying assignments:', error);
  }
}

// Run the verification
verifyBusinessPermitAssignments();