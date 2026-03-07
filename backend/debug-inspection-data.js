const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInspectionData() {
  try {
    console.log('=== DEBUGGING PHYSICAL INSPECTION DATA ===\n');

    // Get all physical inspection reports
    const { data: reports, error: reportsError } = await supabase
      .from('physical_inspection_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return;
    }

    console.log(`Found ${reports.length} physical inspection reports:`);
    reports.forEach((report, index) => {
      console.log(`${index + 1}. Report ID: ${report.id}, Request ID: ${report.request_id}`);
      console.log(`   Visit DateTime: ${report.visit_datetime}`);
      console.log(`   Owner Representative: ${report.owner_representative}`);
      console.log(`   Created: ${report.created_at}\n`);
    });

    if (reports.length === 0) {
      console.log('No physical inspection reports found in database.');
      return;
    }

    // Check the most recent report in detail
    const latestReport = reports[0];
    console.log(`\n=== DETAILED CHECK FOR REPORT ID: ${latestReport.id} ===`);

    // Get area findings
    const { data: areaFindings, error: areaError } = await supabase
      .from('inspection_area_findings')
      .select('*')
      .eq('inspection_report_id', latestReport.id);

    if (areaError) {
      console.error('Error fetching area findings:', areaError);
    } else {
      console.log(`\nArea Findings (${areaFindings.length} records):`);
      areaFindings.forEach(area => {
        console.log(`- ${area.area_name}: ${area.findings || 'No findings'}`);
        console.log(`  Date: ${area.inspection_date || 'No date'}`);
        console.log(`  Remarks: ${area.remarks || 'No remarks'}\n`);
      });
    }

    // Get committee recommendations
    const { data: committeeRecs, error: committeeError } = await supabase
      .from('committee_recommendations')
      .select('*')
      .eq('inspection_report_id', latestReport.id);

    if (committeeError) {
      console.error('Error fetching committee recommendations:', committeeError);
    } else {
      console.log(`Committee Recommendations (${committeeRecs.length} records):`);
      committeeRecs.forEach(committee => {
        console.log(`- ${committee.committee_name}: ${committee.signatory_name || 'No signatory'}`);
        console.log(`  Date: ${committee.recommendation_date || 'No date'}\n`);
      });
    }

    // Test the certificate generation service method
    console.log('\n=== TESTING CERTIFICATE GENERATION SERVICE ===');
    
    // Import the singleton instance
    const certService = require('./services/certificateGenerationService');
    
    const inspectionData = await certService.getPhysicalInspectionData(latestReport.request_id);
    console.log('Certificate service returned:');
    console.log(JSON.stringify(inspectionData, null, 2));

    // Check if the request exists and its status
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', latestReport.request_id)
      .single();

    if (requestError) {
      console.error('Error fetching request:', requestError);
    } else {
      console.log(`\nRequest Status: ${request.status}`);
      console.log(`Request Type: ${request.certificate_type}`);
      console.log(`Reference: ${request.reference_number}`);
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugInspectionData();