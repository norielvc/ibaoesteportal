const { createClient } = require('@supabase/supabase-js');
const officialReceiptService = require('./services/officialReceiptService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testORGeneration() {
  try {
    console.log('=== TESTING OFFICIAL RECEIPT GENERATION ===\n');

    // Get a business permit request in Treasury status
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('certificate_type', 'business_permit')
      .eq('status', 'Treasury')
      .single();

    if (requestError) {
      console.error('Error fetching request:', requestError);
      console.log('No business permit request found in Treasury status');
      return;
    }

    console.log('Request found:');
    console.log(`- ID: ${request.id}`);
    console.log(`- Reference: ${request.reference_number}`);
    console.log(`- Status: ${request.status}`);
    console.log(`- Applicant: ${request.full_name || request.applicant_name}\n`);

    // Test OR generation
    console.log('Generating Official Receipt...');
    const result = await officialReceiptService.generateOfficialReceipt(request.id, 100);
    
    console.log('OR generation result:');
    console.log(`- Success: ${result.success}`);
    
    if (result.success) {
      console.log(`- OR Number: ${result.orNumber}`);
      console.log(`- File path: ${result.filePath}`);
      console.log('\n✅ Official Receipt generated successfully!');
      
      // Check if file exists
      const fs = require('fs');
      const fileExists = fs.existsSync(result.filePath);
      console.log(`- File exists: ${fileExists}`);
      
      if (fileExists) {
        const fileSize = fs.statSync(result.filePath).size;
        console.log(`- File size: ${fileSize} bytes`);
      }
    } else {
      console.log(`- Error: ${result.error}`);
      console.log('\n❌ Official Receipt generation failed');
    }

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testORGeneration();