const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findRequest() {
  console.log('🔍 Finding request by reference number\n');
  
  // Search for requests with reference starting with 2026-0307
  const { data: requests } = await supabase
    .from('certificate_requests')
    .select('id, reference_number, full_name, status')
    .ilike('reference_number', '2026-0307%')
    .limit(5);
  
  console.log(`Found ${requests.length} requests:\n`);
  
  requests.forEach(r => {
    console.log(`📋 ${r.reference_number}`);
    console.log(`   ID: ${r.id}`);
    console.log(`   Name: ${r.full_name}`);
    console.log(`   Status: ${r.status}\n`);
  });
  
  if (requests.length > 0) {
    const requestId = requests[0].id;
    console.log(`\n📊 Checking history for request: ${requestId}\n`);
    
    const { data: history } = await supabase
      .from('workflow_history')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    
    console.log(`Found ${history.length} history entries:\n`);
    
    history.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.step_name} - ${entry.action.toUpperCase()}`);
      console.log(`   User: ${entry.performed_by}`);
      console.log(`   Time: ${entry.created_at}`);
      console.log(`   Comments: "${entry.comments || '(empty)'}"`);
      console.log('');
    });
  }
}

findRequest().catch(console.error);
