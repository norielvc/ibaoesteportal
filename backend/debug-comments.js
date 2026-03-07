const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugComments() {
  const requestId = '2026-0307001'; // From the screenshot
  
  console.log('🔍 Debugging Comments in Workflow History\n');
  
  // Get all history entries for this request
  const { data: history } = await supabase
    .from('workflow_history')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  
  console.log(`📊 Found ${history.length} history entries:\n`);
  
  history.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.step_name} - ${entry.action.toUpperCase()}`);
    console.log(`   User: ${entry.performed_by}`);
    console.log(`   Time: ${entry.created_at}`);
    console.log(`   Comments: "${entry.comments || '(empty)'}"`);
    console.log(`   Comment length: ${entry.comments?.length || 0} chars`);
    console.log('');
  });
  
  // Check if any comments are custom (not auto-generated)
  const customComments = history.filter(h => 
    h.comments && 
    !['Action Completed', 'Request sent back for revision', 'Request approved and forwarded', 'Request rejected'].includes(h.comments)
  );
  
  console.log(`\n✅ Custom comments found: ${customComments.length}`);
  if (customComments.length > 0) {
    customComments.forEach(c => {
      console.log(`   - "${c.comments}"`);
    });
  } else {
    console.log('   ⚠️  No custom comments found - only auto-generated ones');
  }
}

debugComments().catch(console.error);
