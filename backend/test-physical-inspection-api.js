const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPhysicalInspectionAPI() {
  console.log('🧪 Testing Physical Inspection API...');
  
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

    console.log(`📋 Testing with request: ${request.reference_number} (Status: ${request.status})`);

    // Test data
    const testInspectionData = {
      areas: {
        'HEALTH AND SAFETY': { 
          findings: 'All safety protocols are in place', 
          date: '2026-03-05', 
          remarks: 'Compliant' 
        },
        'SANITATION': { 
          findings: 'Clean and well-maintained', 
          date: '2026-03-05', 
          remarks: 'Excellent' 
        },
        'BUILDING PERMIT': { 
          findings: 'Valid building permit on display', 
          date: '2026-03-05', 
          remarks: 'Verified' 
        }
      },
      visitDateTime: '2026-03-05T10:30',
      ownerRepresentative: 'MARIA SANTOS GONZALES',
      recommendations: {
        'HEALTH': { name: 'DR. JUAN DELA CRUZ', date: '2026-03-05' },
        'ENVIRONMENT': { name: 'ENGR. MARIA LOPEZ', date: '2026-03-05' }
      }
    };

    // Test creating/updating inspection report
    console.log('💾 Saving inspection data...');
    const saveResponse = await fetch(`http://localhost:5005/api/physical-inspection/request/${request.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_TOKEN}` // You'll need a valid token
      },
      body: JSON.stringify({ inspectionData: testInspectionData })
    });

    if (!saveResponse.ok) {
      console.log('❌ Failed to save inspection data');
      console.log('Response status:', saveResponse.status);
      const errorText = await saveResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const saveResult = await saveResponse.json();
    console.log('✅ Save result:', saveResult);

    // Test retrieving inspection report
    console.log('📖 Retrieving inspection data...');
    const getResponse = await fetch(`http://localhost:5005/api/physical-inspection/request/${request.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN}`
      }
    });

    if (!getResponse.ok) {
      console.log('❌ Failed to retrieve inspection data');
      return;
    }

    const getResult = await getResponse.json();
    console.log('✅ Retrieved data:', JSON.stringify(getResult.data, null, 2));

    // Verify data in database
    console.log('🔍 Verifying database records...');
    
    const { data: report, error: reportError } = await supabase
      .from('physical_inspection_reports')
      .select('*')
      .eq('request_id', request.id)
      .single();

    if (reportError) {
      console.log('❌ Error fetching report:', reportError);
      return;
    }

    console.log('📄 Report record:', {
      id: report.id,
      visit_datetime: report.visit_datetime,
      owner_representative: report.owner_representative,
      inspection_status: report.inspection_status
    });

    const { data: areas, error: areasError } = await supabase
      .from('inspection_area_findings')
      .select('*')
      .eq('inspection_report_id', report.id);

    if (areasError) {
      console.log('❌ Error fetching areas:', areasError);
      return;
    }

    console.log(`📋 Area findings: ${areas.length} records`);
    areas.forEach(area => {
      console.log(`  - ${area.area_name}: ${area.findings}`);
    });

    const { data: committees, error: committeesError } = await supabase
      .from('committee_recommendations')
      .select('*')
      .eq('inspection_report_id', report.id);

    if (committeesError) {
      console.log('❌ Error fetching committees:', committeesError);
      return;
    }

    console.log(`👥 Committee recommendations: ${committees.length} records`);
    committees.forEach(committee => {
      console.log(`  - ${committee.committee_name}: ${committee.signatory_name}`);
    });

    console.log('✅ Physical Inspection API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing physical inspection API:', error);
  }
}

// Run the test
testPhysicalInspectionAPI();