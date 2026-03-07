const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testORFileAccess() {
  try {
    console.log('🧪 Testing OR File Access...\n');
    
    // Test the latest OR file
    const testFile = 'OR_26-000004_2026-03-05T12-53-26-296Z.html';
    const testURL = `http://localhost:5005/api/official-receipts/files/${testFile}`;
    
    console.log('Testing URL:', testURL);
    
    const response = await fetch(testURL);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ File served successfully');
      console.log('Content length:', content.length);
      console.log('Content preview:', content.substring(0, 200) + '...');
      
      // Check if it's valid OR HTML
      if (content.includes('Official Receipt') && content.includes('26-000004')) {
        console.log('✅ Content contains OR number and title');
      } else {
        console.log('❌ Content may be missing OR details');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
    // Test the OR generation API response format
    console.log('\n🔍 Testing OR Generation Response Format...');
    
    // Simulate what the frontend receives
    const mockResponse = {
      success: true,
      orNumber: '26-000004',
      filePath: 'OR_26-000004_2026-03-05T12-53-26-296Z.html'
    };
    
    console.log('Mock API response:', mockResponse);
    console.log('Frontend would fetch:', `http://localhost:5005/api/official-receipts/files/${mockResponse.filePath}`);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testORFileAccess();