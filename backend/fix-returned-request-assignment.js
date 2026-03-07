const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReturnedRequestAssignment() {
  const requestId = '9ea073f8-9dc1-44e0-a3f0-79433217b464';
  
  console.log('🔧 Fixing Returned Request Assignment\n');
  
  // 1. Get request details
  const { data: request } = await supabase
    .from('certificate_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  console.log(`📋 Request: ${request.certificate_type} (${request.status})\n`);
  
  // 2. Get the workflow configuration for business_permit
  const { data: workflowConfig } = await supabase
    .from('workflow_configurations')
    .select('*')
    .eq('certificate_type', 'business_permit')
    .single();
  
  if (!workflowConfig || !workflowConfig.workflow_config) {
    console.log('❌ No workflow configuration found for business_permit');
    return;
  }
  
  const steps = workflowConfig.workflow_config.steps || [];
  console.log(`📊 Workflow has ${steps.length} steps\n`);
  
  // 3. Find the staff_review step (Review Request Team)
  const staffReviewStep = steps.find(s => s.status === 'staff_review' || s.id === 111);
  
  if (!staffReviewStep) {
    console.log('❌ No staff_review step found in workflow');
    return;
  }
  
  console.log(`✅ Found staff_review step: ${staffReviewStep.name}`);
  console.log(`   Assigned users: ${staffReviewStep.assignedUsers?.length || 0}\n`);
  
  // 4. Create pending assignments for all assigned users
  if (staffReviewStep.assignedUsers && staffReviewStep.assignedUsers.length > 0) {
    console.log('📝 Creating pending assignments...\n');
    
    for (const userId of staffReviewStep.assignedUsers) {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('workflow_assignments')
        .select('id')
        .eq('request_id', requestId)
        .eq('step_id', String(staffReviewStep.id))
        .eq('assigned_user_id', userId)
        .eq('status', 'pending')
        .single();
      
      if (existing) {
        console.log(`   ⏭️  Assignment already exists for user ${userId}`);
        continue;
      }
      
      // Create new assignment
      const { data: newAssignment, error } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: requestId,
          request_type: request.certificate_type,
          step_id: String(staffReviewStep.id),
          step_name: staffReviewStep.name,
          assigned_user_id: userId,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) {
        console.log(`   ❌ Error creating assignment for user ${userId}:`, error.message);
      } else {
        console.log(`   ✅ Created assignment ${newAssignment.id} for user ${userId}`);
      }
    }
    
    console.log('\n✅ Fix completed! The request now has pending assignments.');
    console.log('   Users can now proceed with the physical inspection.');
  } else {
    console.log('⚠️  No users assigned to staff_review step');
    console.log('   Please assign users in the Workflows page first.');
  }
}

fixReturnedRequestAssignment().catch(console.error);
