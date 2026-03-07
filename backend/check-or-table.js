const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkORTable() {
  try {
    console.log('Checking if official_receipts table exists...');
    
    // Try to query the table directly
    const { data, error } = await supabase
      .from('official_receipts')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        console.log('❌ official_receipts table does not exist');
        console.log('Please run the CREATE_OFFICIAL_RECEIPTS_TABLE.sql script in Supabase SQL Editor');
        console.log('The SQL file is located at: backend/CREATE_OFFICIAL_RECEIPTS_TABLE.sql');
      } else {
        console.error('Error querying table:', error);
      }
    } else {
      console.log('✅ official_receipts table exists');
      console.log('Found', data ? data.length : 0, 'records');
    }
    
    // Also test a simple insert to see if the API works
    console.log('\nTesting OR generation API...');
    
    // Check if we have any business permit requests in Treasury status
    const { data: requests, error: reqError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .eq('status', 'Treasury')
      .eq('certificate_type', 'business_permit')
      .limit(1);
    
    if (reqError) {
      console.error('Error checking requests:', reqError);
    } else if (requests && requests.length > 0) {
      console.log('Found Treasury request for testing:', requests[0]);
    } else {
      console.log('No Treasury business permit requests found for testing');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkORTable();