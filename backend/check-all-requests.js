const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllRequests() {
  const { data } = await supabase
    .from('certificate_requests')
    .select('reference_number, status, full_name')
    .eq('certificate_type', 'business_permit')
    .order('created_at', { ascending: false });
    
  console.log('All business permit requests:');
  data.forEach(r => {
    console.log(`- ${r.reference_number}: ${r.status} (${r.full_name})`);
  });
}

checkAllRequests();