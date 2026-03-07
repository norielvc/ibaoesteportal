const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingORs() {
  try {
    console.log('Checking existing Official Receipts...');
    
    const { data: ors, error } = await supabase
      .from('official_receipts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${ors.length} Official Receipt(s):`);
    
    ors.forEach((or, index) => {
      console.log(`\n${index + 1}. OR #${or.or_number}`);
      console.log(`   Request ID: ${or.request_id}`);
      console.log(`   Amount: ₱${or.amount}`);
      console.log(`   Payor: ${or.payor_name}`);
      console.log(`   Business: ${or.business_name}`);
      console.log(`   Created: ${new Date(or.created_at).toLocaleString()}`);
    });
    
    // Check Treasury requests
    console.log('\n--- Treasury Requests ---');
    const { data: treasuryReqs, error: treasuryError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, full_name, status, certificate_type')
      .eq('status', 'Treasury')
      .eq('certificate_type', 'business_permit');
    
    if (treasuryError) {
      console.error('Treasury error:', treasuryError);
    } else {
      console.log(`Found ${treasuryReqs.length} Treasury business permit request(s):`);
      treasuryReqs.forEach((req, index) => {
        console.log(`${index + 1}. ${req.reference_number} - ${req.full_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingORs();