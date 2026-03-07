const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCertificateGeneration() {
  try {
    console.log('=== TESTING CERTIFICATE GENERATION ===\n');

    // Get a business permit request that has physical inspection data
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('certificate_type', 'business_permit')
      .eq('id', 'd0228bd9-8324-4da0-a189-e8f5616395e8') // The request ID from our debug
      .single();

    if (requestError) {
      console.error('Error fetching request:', requestError);
      return;
    }

    console.log('Request found:');
    console.log(`- ID: ${request.id}`);
    console.log(`- Reference: ${request.reference_number}`);
    console.log(`- Status: ${request.status}`);
    console.log(`- Type: ${request.certificate_type}\n`);

    // Test certificate generation
    const certService = require('./services/certificateGenerationService');
    
    console.log('Generating certificate...');
    const result = await certService.generateCertificate(request.id);
    
    console.log('Certificate generation result:');
    console.log(`- Success: ${result.success}`);
    console.log(`- File path: ${result.filePath}`);
    
    if (result.success) {
      console.log('\n✅ Certificate generated successfully!');
      
      // Read a portion of the generated HTML to check if inspection data is included
      const fs = require('fs');
      const htmlContent = fs.readFileSync(result.filePath, 'utf8');
      
      // Check if inspection data appears in the HTML
      const hasInspectionData = htmlContent.includes('testing for today');
      const hasVisitDateTime = htmlContent.includes('Date and Time of Visit');
      const hasOwnerRep = htmlContent.includes('Name of Owner / Representative');
      
      console.log('\nInspection data check:');
      console.log(`- Contains inspection findings: ${hasInspectionData}`);
      console.log(`- Contains visit date/time section: ${hasVisitDateTime}`);
      console.log(`- Contains owner representative section: ${hasOwnerRep}`);
      
      if (hasInspectionData) {
        console.log('\n✅ Physical inspection data is properly included in the certificate!');
      } else {
        console.log('\n❌ Physical inspection data is NOT included in the certificate.');
        
        // Show a snippet of the inspection section
        const inspectionSectionMatch = htmlContent.match(/<div class="section">[\s\S]*?A\. Actions Taken by Inspection Committee[\s\S]*?<\/div>/);
        if (inspectionSectionMatch) {
          console.log('\nInspection section found in HTML:');
          console.log(inspectionSectionMatch[0].substring(0, 500) + '...');
        }
      }
    } else {
      console.log('\n❌ Certificate generation failed:', result.error);
    }

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testCertificateGeneration();