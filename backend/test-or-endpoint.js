const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

async function testOREndpoint() {
  try {
    console.log('Testing OR file serving endpoint...');
    
    // Get a test file
    const receiptsDir = path.resolve(__dirname, 'generated-receipts');
    const files = fs.readdirSync(receiptsDir);
    
    if (files.length === 0) {
      console.log('No OR files found for testing');
      return;
    }
    
    const testFile = 'OR_26-000003_2026-03-05T11-56-07-560Z.html';
    console.log('Testing with file:', testFile);
    
    // Test the endpoint
    const url = `http://localhost:5005/api/official-receipts/files/${testFile}`;
    console.log('Testing URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ File served successfully');
      console.log('Content length:', content.length);
      console.log('Content preview:', content.substring(0, 100) + '...');
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
  }
}

testOREndpoint();