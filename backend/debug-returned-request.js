const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugReturnedRequest() {
  const requestId = '9ea073f8-9dc1-44e0-a3f0-79433217b464'; // From the logs
  
  console.log('🔍 Debugging Returned Request Assignment Issue\n');
  
  // 1. Check request status
  const { data: request } = await supabase
    .from('certificate_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  console.log('📋 Request Details:');
  console.log(`   ID: ${request.id}`);
  console.log(`   Status: ${request.status}`);
  console.log(`   Type: ${request.certificate_type}`);
  console.log(`   Created: ${request.created_at}\n`);
  
  // 2. Check all assignments for this request
  const { data: assignments } = await supabase
    .from('workflow_assignments')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  
  console.log(`📊 Found ${assignments.length} assignments:\n`);
  
  assignments.forEach((a, i) => {
    console.log(`   ${i + 1}. Assignment ID: ${a.id}`);
    console.log(`      Step: ${a.step_name} (${a.step_id})`);
    console.log(`      Assigned to: ${a.assigned_user_id}`);
    console.log(`      Status: ${a.status}`);
    console.log(`      Created: ${a.created_at}`);
    if (a.completed_at) console.log(`      Completed: ${a.completed_at}`);
    console.log('');
  });
  
  // 3. Check pending assignments
  const pending = assignments.filter(a => a.status === 'pending');
  console.log(`\n✅ Pending assignments: ${pending.length}`);
  if (pending.length > 0) {
    pending.forEach(p => {
      console.log(`   - ${p.step_name} assigned to ${p.assigned_user_id}`);
    });
  } else {
    console.log('   ⚠️  No pending assignments found!');
    console.log('   This is why the "Not assigned to this request" error occurs.');
  }
  
  // 4. Check if request status is "returned"
  if (request.status === 'returned') {
    console.log('\n🔄 Request Status: RETURNED');
    console.log('   When a request is returned, a new pending assignment should be created');
    console.log('   for the staff_review step (Review Request Team).');
    console.log('\n   Recommendation: Create a pending assignment for staff_review step');
  }
}

debugReturnedRequest().catch(console.error);
