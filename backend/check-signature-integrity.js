const { supabase } = require('./services/supabaseClient');

async function checkSignatureIntegrity() {
  try {
    console.log('🔍 Checking signature data integrity...');
    
    // Get the latest signature
    const { data: signatures, error } = await supabase
      .from('user_signatures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Error getting signature:', error);
      return;
    }
    
    if (signatures.length === 0) {
      console.log('❌ No signatures found');
      return;
    }
    
    const sig = signatures[0];
    console.log('✅ Found signature:', sig.name);
    console.log('📊 Data analysis:');
    console.log('- Length:', sig.signature_data ? sig.signature_data.length : 0);
    console.log('- Starts with:', sig.signature_data ? sig.signature_data.substring(0, 50) : 'No data');
    console.log('- Ends with:', sig.signature_data ? sig.signature_data.substring(sig.signature_data.length - 20) : 'No data');
    
    if (sig.signature_data) {
      // Check if it's a valid data URL
      const isValidDataURL = sig.signature_data.startsWith('data:image/');
      const hasBase64 = sig.signature_data.includes('base64,');
      const hasProperEnding = sig.signature_data.endsWith('=') || sig.signature_data.endsWith('==') || /[A-Za-z0-9]$/.test(sig.signature_data);
      
      console.log('🔍 Validation:');
      console.log('- Valid data URL format:', isValidDataURL);
      console.log('- Has base64 marker:', hasBase64);
      console.log('- Proper ending:', hasProperEnding);
      
      if (isValidDataURL && hasBase64) {
        const mimeType = sig.signature_data.split(';')[0].split(':')[1];
        const base64Data = sig.signature_data.split('base64,')[1];
        
        console.log('- MIME type:', mimeType);
        console.log('- Base64 data length:', base64Data ? base64Data.length : 0);
        
        // Check if base64 is valid length (should be multiple of 4)
        const isValidBase64Length = base64Data && base64Data.length % 4 === 0;
        console.log('- Valid base64 length:', isValidBase64Length);
        
        // Try to validate base64 format
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        const isValidBase64Format = base64Data && base64Regex.test(base64Data);
        console.log('- Valid base64 format:', isValidBase64Format);
      }
    }
    
    console.log('\n🧪 Testing image creation...');
    
    // Test creating a simple signature and checking its format
    const canvas = require('canvas');
    const testCanvas = canvas.createCanvas(200, 100);
    const ctx = testCanvas.getContext('2d');
    
    // Draw a simple test signature
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 100);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.lineTo(180, 50);
    ctx.stroke();
    
    const testDataURL = testCanvas.toDataURL('image/png');
    console.log('✅ Test signature created');
    console.log('- Test length:', testDataURL.length);
    console.log('- Test starts with:', testDataURL.substring(0, 50));
    console.log('- Test ends with:', testDataURL.substring(testDataURL.length - 20));
    
    // Compare with database signature
    if (sig.signature_data) {
      console.log('\n📊 Comparison:');
      console.log('- DB signature length:', sig.signature_data.length);
      console.log('- Test signature length:', testDataURL.length);
      console.log('- Length difference:', Math.abs(sig.signature_data.length - testDataURL.length));
      
      const dbStart = sig.signature_data.substring(0, 100);
      const testStart = testDataURL.substring(0, 100);
      console.log('- Headers match:', dbStart === testStart ? 'No (different images)' : 'Different formats');
    }
    
  } catch (error) {
    if (error.message.includes('canvas')) {
      console.log('⚠️  Canvas module not available, skipping image creation test');
      console.log('   Run: npm install canvas (optional for this test)');
    } else {
      console.error('❌ Error:', error);
    }
  }
}

checkSignatureIntegrity();