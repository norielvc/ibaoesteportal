const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBusinessPermitWorkflow() {
  console.log('🔧 Fixing Business Permit Workflow Assignments...');
  
  try {
    // 1. Get all business permit requests that are in staff_review or pending status
    const { data: businessPermitRequests, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .eq('certificate_type', 'business_permit')
      .in('status', ['pending', 'staff_review', 'submitted']);

    if (fetchError) {
      console.error('❌ Error fetching business permit requests:', fetchError);
      return;
    }

    console.log(`📋 Found ${businessPermitRequests.length} business permit requests to process`);

    // 2. Get the staff user ID (Brook Dono - Releasing Team member who handles initial reviews)
    const { data: staffUser, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('email', 'brook@example.com')
      .single();

    if (userError || !staffUser) {
      console.log('⚠️ Brook user not found, using default staff assignment');
      // Use the default staff assignment from workflowService
      const defaultStaffId = "0daafd45-47d3-40a9-bb2b-3a337226b3af"; // Brook Dono ID
      
      for (const request of businessPermitRequests) {
        await createWorkflowAssignment(request, defaultStaffId);
      }
    } else {
      console.log(`👤 Found staff user: ${staffUser.first_name} ${staffUser.last_name}`);
      
      for (const request of businessPermitRequests) {
        await createWorkflowAssignment(request, staffUser.id);
      }
    }

    console.log('✅ Business permit workflow assignments fixed!');

  } catch (error) {
    console.error('❌ Error fixing business permit workflow:', error);
  }
}

async function createWorkflowAssignment(request, staffUserId) {
  try {
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('workflow_assignments')
      .select('id')
      .eq('request_id', request.id)
      .eq('step_id', '111')
      .eq('status', 'pending')
      .single();

    if (existingAssignment) {
      console.log(`⏭️ Assignment already exists for ${request.reference_number}`);
      return;
    }

    // Create new workflow assignment for staff review step
    const { error: insertError } = await supabase
      .from('workflow_assignments')
      .insert([{
        request_id: request.id,
        request_type: 'business_permit',
        step_id: '111',
        step_name: 'Review Request Team',
        assigned_user_id: staffUserId,
        status: 'pending'
      }]);

    if (insertError) {
      console.error(`❌ Error creating assignment for ${request.reference_number}:`, insertError);
    } else {
      console.log(`✅ Created workflow assignment for ${request.reference_number}`);
    }

    // Update request status to staff_review if it's still pending
    if (request.status === 'pending' || request.status === 'submitted') {
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'staff_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error(`❌ Error updating status for ${request.reference_number}:`, updateError);
      } else {
        console.log(`📝 Updated status to staff_review for ${request.reference_number}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error processing ${request.reference_number}:`, error);
  }
}

// Run the fix
fixBusinessPermitWorkflow();