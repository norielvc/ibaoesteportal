const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateAssignments() {
  console.log('🧹 Cleaning up duplicate workflow assignments...');
  
  try {
    // Get all business permit assignments grouped by request_id and step_id
    const { data: assignments, error } = await supabase
      .from('workflow_assignments')
      .select('id, request_id, step_id, assigned_user_id, status, created_at')
      .eq('request_type', 'business_permit')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching assignments:', error);
      return;
    }

    console.log(`📋 Found ${assignments.length} pending business permit assignments`);

    // Group by request_id and step_id to find duplicates
    const grouped = assignments.reduce((acc, assignment) => {
      const key = `${assignment.request_id}-${assignment.step_id}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(assignment);
      return acc;
    }, {});

    let deletedCount = 0;

    for (const [key, assignmentGroup] of Object.entries(grouped)) {
      if (assignmentGroup.length > 1) {
        console.log(`\n🔍 Found ${assignmentGroup.length} duplicates for ${key}`);
        
        // Keep the first one (oldest), delete the rest
        const toKeep = assignmentGroup[0];
        const toDelete = assignmentGroup.slice(1);

        console.log(`  ✅ Keeping: ${toKeep.id} (created: ${toKeep.created_at})`);
        
        for (const duplicate of toDelete) {
          console.log(`  🗑️ Deleting: ${duplicate.id} (created: ${duplicate.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('workflow_assignments')
            .delete()
            .eq('id', duplicate.id);

          if (deleteError) {
            console.error(`    ❌ Error deleting ${duplicate.id}:`, deleteError);
          } else {
            console.log(`    ✅ Deleted ${duplicate.id}`);
            deletedCount++;
          }
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate assignments.`);

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  }
}

// Run the cleanup
cleanupDuplicateAssignments();