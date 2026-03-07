const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssignments() {
  try {
    console.log('=== FIXING TREASURY WORKFLOW ASSIGNMENTS ===');
    
    const requestId = 'd0228bd9-8324-4da0-a189-e8f5616395e8';
    
    // Mark all old pending assignments as completed (except Treasury)
    const { data: updatedAssignments, error: updateError } = await supabase
      .from('workflow_assignments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .neq('step_name', 'OR Preparation') // Don't update the Treasury assignment
      .select();
    
    if (updateError) {
      console.error('Error updating assignments:', updateError);
      return;
    }
    
    console.log(`✅ Updated ${updatedAssignments.length} old pending assignments to completed:`);
    updatedAssignments.forEach(a => {
      console.log(`- ${a.step_name} for user ${a.assigned_user_id}`);
    });
    
    // Verify the current state
    const { data: currentAssignments } = await supabase
      .from('workflow_assignments')
      .select('step_name, assigned_user_id, status')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
      
    console.log('\n📋 Current Assignment Status:');
    currentAssignments.forEach(a => {
      console.log(`- ${a.step_name}: ${a.status}`);
    });
    
    // Check which users should see this request now
    const pendingAssignments = currentAssignments.filter(a => a.status === 'pending');
    console.log(`\n👥 Users who should see this request (${pendingAssignments.length}):`);
    pendingAssignments.forEach(a => {
      console.log(`- ${a.assigned_user_id} (${a.step_name})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAssignments();