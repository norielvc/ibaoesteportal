const fetch = require('node-fetch');

const API_URL = 'http://localhost:5005/api';

// Test the physical inspection fix
async function testPhysicalInspectionFix() {
  console.log('🧪 Testing Physical Inspection Assignment Fix\n');

  // You'll need to replace these with actual values from your system
  const testRequestId = 'YOUR_REQUEST_ID'; // Replace with actual request ID
  const testToken = 'YOUR_AUTH_TOKEN'; // Replace with actual auth token

  console.log('📋 Test Configuration:');
  console.log(`   Request ID: ${testRequestId}`);
  console.log(`   API URL: ${API_URL}\n`);

  try {
    console.log('1️⃣ Testing active-assignment endpoint...');
    const response = await fetch(`${API_URL}/workflow-assignments/active-assignment/${testRequestId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS: Assignment found!');
      console.log(`   Assignment ID: ${data.assignment.id}`);
      console.log(`   Step: ${data.assignment.step_name}`);
      console.log(`   Status: ${data.assignment.status}`);
      
      if (data.selfHealed) {
        console.log('   ℹ️  Assignment was auto-created (self-healed)');
      }
      if (data.created) {
        console.log('   ℹ️  Assignment was created as fallback');
      }
    } else {
      console.log('\n❌ FAILED: Could not get assignment');
      console.log(`   Error: ${data.message}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  Physical Inspection Assignment Fix - Test Script');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📝 Instructions:');
console.log('1. Make sure your backend server is running');
console.log('2. Update testRequestId and testToken in this script');
console.log('3. Run: node backend/test-physical-inspection-fix.js\n');

console.log('🔧 What was fixed:');
console.log('   • Endpoint now checks for completed assignments as fallback');
console.log('   • Admins can use any assignment for the request');
console.log('   • Auto-creates assignment for admins if none exists');
console.log('   • Better error handling and logging\n');

// Uncomment to run the test (after updating the values above)
// testPhysicalInspectionFix();

console.log('⚠️  Update the testRequestId and testToken values, then uncomment');
console.log('   the last line to run the test.\n');
