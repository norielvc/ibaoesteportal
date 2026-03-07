const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCertColumns() {
  try {
    console.log('Checking certificate_requests table structure...');
    
    // Get a sample record to see the structure
    const { data: sample, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Sample record columns:');
      console.log(Object.keys(sample[0]));
      
      console.log('\nSample record:');
      console.log(sample[0]);
    } else {
      console.log('No records found in certificate_requests table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCertColumns();