const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessPermitForwarding() {
  console.log('🧪 Testing Business Permit Workflow Forwarding...');
  
  try {
    // Get a business permit request that's currently in staff_review
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .eq('certificate_type', 'business_permit')
      .eq('status', 'staff_review')
      .limit(1)
      .single();

    if (requestError || !request) {
      console.log('❌ No business permit request found in staff_review status');
      return;
    }

    console.log(`📋 Found request: ${request.reference_number} (Status: ${request.status})`);

    // Get the current workflow assignment for this request
    const { data: assignment, error: assignmentError } = await supabase
      .from('workflow_assignments')
      .select('id, step_id, step_name, assigned_user_id, status')
      .eq('request_id', request.id)
      .eq('status', 'pending')
      .single();

    if (assignmentError || !assignment) {
      console.log('❌ No pending assignment found for this request');
      return;
    }

    console.log(`📝 Current assignment: Step ${assignment.step_id} - ${assignment.step_name}`);

    // Simulate the physical_inspection action
    console.log('🚀 Simulating physical_inspection action...');
    
    const response = await fetch(`http://localhost:5005/api/workflow-assignments/${assignment.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_TOKEN}` // You'll need to provide a valid token
      },
      body: JSON.stringify({
        action: 'physical_inspection',
        comment: 'Test: Initiated Physical Inspection - Forms Printed.'
      })
    });

    if (!response.ok) {
      console.log('❌ Failed to trigger physical_inspection action');
      console.log('Response status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Physical inspection action result:', result);

    // Check if new assignment was created for next approver
    const { data: newAssignments, error: newAssignmentError } = await supabase
      .from('workflow_assignments')
      .select(`
        id, step_id, step_name, status, assigned_user_id,
        users(first_name, last_name, email)
      `)
      .eq('request_id', request.id)
      .eq('status', 'pending');

    if (newAssignmentError) {
      console.log('❌ Error checking new assignments:', newAssignmentError);
      return;
    }

    console.log('\n📋 Current pending assignments:');
    newAssignments.forEach(assignment => {
      const user = assignment.users;
      console.log(`  └─ Step ${assignment.step_id}: ${assignment.step_name}`);
      console.log(`     Assigned to: ${user.first_name} ${user.last_name} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error testing workflow forwarding:', error);
  }
}

// Run the test
testBusinessPermitForwarding();