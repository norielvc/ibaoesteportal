const { createClient } = require('@supabase/supabase-js');
const workflowService = require('./services/workflowService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBusinessPermitNextStep() {
  console.log('🔧 Fixing Business Permit Next Step Assignments...');
  
  try {
    // Get business permit requests that are in physical_inspection status
    const { data: requests, error: requestError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .eq('certificate_type', 'business_permit')
      .eq('status', 'physical_inspection');

    if (requestError) {
      console.error('❌ Error fetching requests:', requestError);
      return;
    }

    console.log(`📋 Found ${requests.length} business permit requests in physical_inspection status`);

    for (const request of requests) {
      console.log(`\n📄 Processing ${request.reference_number}...`);

      // Get workflow steps for business permit
      const steps = workflowService.getWorkflowSteps('business_permit');
      console.log('📝 Workflow steps:', steps.map(s => `${s.id}: ${s.name} (${s.status})`));

      // Find the next step after staff_review (which should be secretary_approval)
      const nextStep = steps.find(s => s.status === 'secretary_approval');
      
      if (!nextStep) {
        console.log('❌ No secretary_approval step found in workflow');
        continue;
      }

      console.log(`🎯 Next step: ${nextStep.name} (Step ${nextStep.id})`);

      // Get Franky Dono (Secretary) user ID
      const { data: secretaryUser, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('email', 'franky@example.com')
        .single();

      if (userError || !secretaryUser) {
        console.log('❌ Secretary user not found, using default assignment');
        // Use default secretary assignment from workflowService
        const defaultSecretaryId = "ca847635-fd64-4e69-9cc7-01998200ddfe"; // Franky Dono ID
        await createNextStepAssignment(request, nextStep, defaultSecretaryId);
      } else {
        console.log(`👤 Found secretary: ${secretaryUser.first_name} ${secretaryUser.last_name}`);
        await createNextStepAssignment(request, nextStep, secretaryUser.id);
      }
    }

    console.log('\n✅ Business permit next step assignments fixed!');

  } catch (error) {
    console.error('❌ Error fixing next step assignments:', error);
  }
}

async function createNextStepAssignment(request, nextStep, userId) {
  try {
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('workflow_assignments')
      .select('id')
      .eq('request_id', request.id)
      .eq('step_id', nextStep.id.toString())
      .eq('assigned_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingAssignment) {
      console.log(`⏭️ Assignment already exists for ${request.reference_number}`);
      return;
    }

    // Create new workflow assignment for next step
    const { error: insertError } = await supabase
      .from('workflow_assignments')
      .insert([{
        request_id: request.id,
        request_type: 'business_permit',
        step_id: nextStep.id.toString(),
        step_name: nextStep.name,
        assigned_user_id: userId,
        status: 'pending'
      }]);

    if (insertError) {
      console.error(`❌ Error creating next step assignment for ${request.reference_number}:`, insertError);
    } else {
      console.log(`✅ Created next step assignment for ${request.reference_number}`);
    }

    // Update request status to secretary_approval
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({ 
        status: 'secretary_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) {
      console.error(`❌ Error updating status for ${request.reference_number}:`, updateError);
    } else {
      console.log(`📝 Updated status to secretary_approval for ${request.reference_number}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${request.reference_number}:`, error);
  }
}

// Run the fix
fixBusinessPermitNextStep();