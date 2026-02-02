const { supabase } = require('./services/supabaseClient');

async function checkSignatureData() {
  try {
    console.log('🔍 Checking signature data in database...');
    
    const { data: signatures, error } = await supabase
      .from('user_signatures')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching signatures:', error);
      return;
    }
    
    console.log(`✅ Found ${signatures.length} signatures\n`);
    
    signatures.forEach((sig, index) => {
      console.log(`📝 Signature ${index + 1}:`);
      console.log(`   ID: ${sig.id}`);
      console.log(`   Name: ${sig.name}`);
      console.log(`   User ID: ${sig.user_id}`);
      console.log(`   Has signature_data: ${sig.signature_data ? 'Yes' : 'No'}`);
      console.log(`   Data length: ${sig.signature_data ? sig.signature_data.length : 0}`);
      
      if (sig.signature_data) {
        const dataStart = sig.signature_data.substring(0, 50);
        console.log(`   Data starts with: ${dataStart}...`);
        
        // Check if it's a valid data URL
        const isValidDataURL = sig.signature_data.startsWith('data:image/');
        console.log(`   Valid data URL: ${isValidDataURL ? 'Yes' : 'No'}`);
        
        if (isValidDataURL) {
          const mimeType = sig.signature_data.split(';')[0].split(':')[1];
          console.log(`   MIME type: ${mimeType}`);
        }
      }
      
      console.log(`   Created: ${sig.created_at}`);
      console.log('');
    });
    
    // Test creating a simple signature
    console.log('🧪 Testing signature creation...');
    
    // Create a simple 1x1 pixel PNG data URL for testing
    const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    console.log('Test signature data URL:');
    console.log(testSignature);
    console.log(`Length: ${testSignature.length}`);
    console.log(`Valid: ${testSignature.startsWith('data:image/png;base64,')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSignatureData();