const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testORWithAuth() {
  try {
    console.log('Testing OR generation with proper authentication...');
    
    // First, let's test if we can access the Treasury request
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get a Treasury request
    const { data: treasuryReq, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'Treasury')
      .eq('certificate_type', 'business_permit')
      .limit(1);
    
    if (error) {
      console.error('Error fetching Treasury request:', error);
      return;
    }
    
    if (!treasuryReq || treasuryReq.length === 0) {
      console.log('No Treasury requests found');
      return;
    }
    
    const request = treasuryReq[0];
    console.log('Found Treasury request:', request.id, request.reference_number);
    
    // Test the OR generation endpoint (this would normally require a valid JWT token)
    console.log('OR generation endpoint is ready at:');
    console.log(`POST http://localhost:5005/api/official-receipts/generate/${request.id}`);
    console.log('Body: { "amount": 100 }');
    console.log('Headers: { "Authorization": "Bearer <valid-jwt-token>" }');
    
    // Test file serving (this should work without auth now)
    const testFileURL = 'http://localhost:5005/api/official-receipts/files/OR_26-000003_2026-03-05T11-56-07-560Z.html';
    console.log('\nTesting file serving...');
    
    const response = await fetch(testFileURL);
    console.log('File serving status:', response.status);
    
    if (response.ok) {
      console.log('✅ File serving works correctly');
    } else {
      console.log('❌ File serving issue:', response.statusText);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testORWithAuth();