const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssignments() {
  try {
    console.log('=== CHECKING WORKFLOW ASSIGNMENTS ===');
    
    // Get the Treasury request
    const { data: request } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('reference_number', '2026-0302001')
      .single();
      
    console.log(`Request Status: ${request.status}`);
    console.log(`Request ID: ${request.id}`);
    
    // Get all workflow assignments for this request
    const { data: assignments } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false });
      
    console.log(`\nWorkflow Assignments (${assignments.length}):`);
    assignments.forEach((a, i) => {
      console.log(`${i+1}. Step: ${a.step_name} | User: ${a.assigned_user_id} | Status: ${a.status}`);
      console.log(`   Created: ${a.created_at}`);
    });
    
    // Get user info
    const userIds = [...new Set(assignments.map(a => a.assigned_user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIds);
      
    console.log('\nUser Details:');
    users.forEach(u => {
      console.log(`- ${u.id}: ${u.first_name} ${u.last_name} (${u.email})`);
    });
    
    // Check workflow history
    const { data: history } = await supabase
      .from('workflow_history')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log('\nRecent Workflow History:');
    history.forEach((h, i) => {
      console.log(`${i+1}. ${h.step_name} - ${h.action} (${h.new_status})`);
      console.log(`   By: ${h.performed_by} | ${h.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssignments();