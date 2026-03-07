const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testORGenerationFix() {
  try {
    console.log('Testing OR generation without auto-forwarding...');

    // Find a request in Treasury status
    const { data: requests, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'Treasury')
      .limit(1);

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    if (requests.length === 0) {
      console.log('No requests in Treasury status found');
      return;
    }

    const request = requests[0];
    console.log(`Found request: ${request.id} - ${request.reference_number}`);
    console.log(`Current status: ${request.status}`);

    // Check if OR already exists
    const { data: existingOR } = await supabase
      .from('official_receipts')
      .select('*')
      .eq('request_id', request.id);

    if (existingOR && existingOR.length > 0) {
      console.log('OR already exists for this request:', existingOR[0].or_number);
      
      // Test the forward endpoint
      console.log('\nTesting forward endpoint...');
      const response = await fetch(`http://localhost:3000/api/official-receipts/forward/${request.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer fake-token-for-test`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Forward response:', data);
      } else {
        console.log('Forward failed:', response.status, await response.text());
      }
    } else {
      console.log('No existing OR found - would need to generate one first');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testORGenerationFix();