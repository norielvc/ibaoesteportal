const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteORFlow() {
  try {
    console.log('Testing complete OR generation flow...');
    
    // 1. Check if we have any Treasury requests
    const { data: treasuryRequests, error: treasuryError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'Treasury')
      .eq('certificate_type', 'business_permit')
      .limit(1);
    
    if (treasuryError) {
      console.error('Error checking Treasury requests:', treasuryError);
      return;
    }
    
    if (!treasuryRequests || treasuryRequests.length === 0) {
      console.log('No Treasury business permit requests found');
      
      // Create a test request
      console.log('Creating a test business permit request...');
      
      const testRequest = {
        reference_number: `TEST-BP-${Date.now()}`,
        certificate_type: 'business_permit',
        status: 'Treasury',
        full_name: 'Test Business Owner',
        age: 35,
        sex: 'Male',
        civil_status: 'Single',
        address: 'Test Address, Calumpit, Bulacan',
        contact_number: '09123456789',
        date_of_birth: '1990-01-01',
        place_of_birth: 'Calumpit, Bulacan',
        purpose: 'Business Permit Application',
        details: {
          businessName: 'Test Business Enterprise',
          natureOfBusiness: 'General Merchandise',
          businessAddress: 'Test Business Address'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newRequest, error: createError } = await supabase
        .from('certificate_requests')
        .insert([testRequest])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test request:', createError);
        return;
      }
      
      console.log('✅ Test request created:', newRequest.id);
      console.log('Request details:', {
        id: newRequest.id,
        reference: newRequest.reference_number,
        status: newRequest.status,
        type: newRequest.certificate_type
      });
      
    } else {
      console.log('Found existing Treasury request:', treasuryRequests[0].id);
    }
    
    // 2. Test OR generation API endpoint
    console.log('\n📋 OR generation flow is ready for testing');
    console.log('To test:');
    console.log('1. Login to the frontend as a Treasury user');
    console.log('2. Navigate to the Treasury request');
    console.log('3. Click "Mark as Paid & Generate OR"');
    console.log('4. The OR should generate and open in a new window');
    console.log('5. The request should be forwarded to Releasing Team (oic_review status)');
    
  } catch (error) {
    console.error('Error in test flow:', error);
  }
}

testCompleteORFlow();