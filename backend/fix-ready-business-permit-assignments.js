require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { supabase } = require('./services/supabaseClient');

async function fixReadyBusinessPermitAssignments() {
  try {
    console.log('🔍 Finding business permits with READY status but no releasing team assignment...\n');

    // Get all business permits with status 'ready' or 'oic_review'
    const { data: readyRequests, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('certificate_type', 'business_permit')
      .in('status', ['ready', 'oic_review'])
      .order('created_at', { ascending: false });

    if (requestError) throw requestError;

    console.log(`Found ${readyRequests?.length || 0} business permits with ready/oic_review status\n`);

    if (!readyRequests || readyRequests.length === 0) {
      console.log('✅ No requests to fix');
      return;
    }

    // Get workflow configuration for business_permit
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'business_permit')
      .single();

    const steps = workflowConfig?.workflow_config?.steps || [];
    
    // Find the releasing team step (usually step 999 or oic_review)
    const releasingStep = steps.find(s => 
      s.status === 'oic_review' || 
      s.status === 'ready' || 
      s.name?.toLowerCase().includes('releasing') ||
      s.id === 999
    );

    if (!releasingStep) {
      console.log('❌ Could not find releasing team step in workflow configuration');
      return;
    }

    console.log(`📋 Releasing Team Step: ${releasingStep.name} (ID: ${releasingStep.id})`);
    console.log(`👥 Assigned Users: ${releasingStep.assignedUsers?.join(', ') || 'None'}\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const request of readyRequests) {
      console.log(`\n📄 Processing: ${request.reference_number}`);
      console.log(`   Status: ${request.status}`);

      // Check if releasing team assignment already exists
      const { data: existingAssignments } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', request.id)
        .eq('step_id', releasingStep.id.toString());

      if (existingAssignments && existingAssignments.length > 0) {
        console.log(`   ⏭️  Already has ${existingAssignments.length} releasing team assignment(s) - SKIPPED`);
        skippedCount++;
        continue;
      }

      // Create assignments for each user in the releasing team
      const assignedUsers = releasingStep.assignedUsers || [];
      
      if (assignedUsers.length === 0) {
        console.log(`   ⚠️  No users assigned to releasing team - SKIPPED`);
        skippedCount++;
        continue;
      }

      for (const userId of assignedUsers) {
        const { error: insertError } = await supabase
          .from('workflow_assignments')
          .insert([{
            request_id: request.id,
            request_type: 'business_permit',
            step_id: releasingStep.id.toString(),
            step_name: releasingStep.name,
            assigned_user_id: userId,
            status: 'pending',
            assigned_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.log(`   ❌ Failed to create assignment for user ${userId}: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created assignment for user: ${userId}`);
        }
      }

      fixedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total Requests: ${readyRequests.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixReadyBusinessPermitAssignments()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
