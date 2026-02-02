const { supabase } = require('./services/supabaseClient');

async function testSignatureTables() {
  try {
    console.log('Testing signature tables...');
    
    // Test if user_signatures table exists
    const { data: signatures, error: sigError } = await supabase
      .from('user_signatures')
      .select('count')
      .limit(1);
    
    if (sigError) {
      console.log('❌ user_signatures table does not exist');
      console.log('Error:', sigError.message);
    } else {
      console.log('✅ user_signatures table exists');
    }
    
    // Test if user_settings table exists
    const { data: settings, error: setError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);
    
    if (setError) {
      console.log('❌ user_settings table does not exist');
      console.log('Error:', setError.message);
    } else {
      console.log('✅ user_settings table exists');
    }
    
    // Test if users table exists (for reference)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (userError) {
      console.log('❌ users table does not exist');
      console.log('Error:', userError.message);
    } else {
      console.log('✅ users table exists');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testSignatureTables();