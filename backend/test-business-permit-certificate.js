const { createClient } = require('@supabase/supabase-js');
const certificateService = require('./services/certificateGenerationService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessPermitCertificate() {
  console.log('🧪 Testing Business Permit Certificate Generation...');
  
  try {
    // Get a business permit request
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .eq('certificate_type', 'business_permit')
      .limit(1)
      .single();

    if (requestError || !request) {
      console.log('❌ No business permit request found');
      return;
    }

    console.log(`📋 Testing certificate generation for: ${request.reference_number}`);

    // Test certificate generation
    console.log('📄 Generating certificate...');
    const result = await certificateService.generateCertificate(request.id);

    if (result.success) {
      console.log('✅ Certificate generated successfully!');
      console.log(`📁 File path: ${result.filePath}`);
      console.log(`📄 Filename: ${result.filename}`);
      console.log(`🔗 Reference: ${result.referenceNumber}`);
    } else {
      console.log('❌ Certificate generation failed');
    }

    // Check if physical inspection data was fetched
    console.log('🔍 Checking physical inspection data...');
    const inspectionData = await certificateService.getPhysicalInspectionData(request.id);
    
    console.log('📋 Inspection areas found:', Object.keys(inspectionData.areas).length);
    console.log('👥 Committee recommendations found:', Object.keys(inspectionData.recommendations).length);
    console.log('🏢 Owner representative:', inspectionData.ownerRepresentative || 'Not set');
    console.log('📅 Visit date/time:', inspectionData.visitDateTime || 'Not set');

    // Show sample area data
    const firstArea = Object.entries(inspectionData.areas)[0];
    if (firstArea) {
      console.log(`📝 Sample area (${firstArea[0]}):`, firstArea[1]);
    }

    console.log('✅ Business permit certificate test completed!');

  } catch (error) {
    console.error('❌ Error testing business permit certificate:', error);
  }
}

// Run the test
testBusinessPermitCertificate();