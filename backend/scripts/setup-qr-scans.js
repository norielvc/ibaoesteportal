const { supabase } = require('../services/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupQRScansTable() {
  try {
    console.log('🔧 Setting up QR scans table...');

    // Create the table using raw SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: `
        -- Create qr_scans table for storing general QR scan data
        CREATE TABLE IF NOT EXISTS qr_scans (
            id SERIAL PRIMARY KEY,
            qr_data TEXT NOT NULL,
            scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            scanner_type VARCHAR(50) DEFAULT 'mobile',
            device_info JSONB DEFAULT '{}',
            scanned_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_qr_scans_timestamp ON qr_scans(scan_timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_data ON qr_scans(qr_data);
        CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_by ON qr_scans(scanned_by);
        CREATE INDEX IF NOT EXISTS idx_qr_scans_created_at ON qr_scans(created_at DESC);

        -- Grant permissions
        GRANT ALL ON qr_scans TO authenticated;
        GRANT ALL ON qr_scans TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE qr_scans_id_seq TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE qr_scans_id_seq TO service_role;
      `
    });
    
    if (error && !error.message.includes('already exists')) {
      console.error('❌ Error creating QR scans table:', error);
      
      // Try alternative approach - direct table creation
      const { error: createError } = await supabase
        .from('qr_scans')
        .select('count(*)')
        .limit(1);
        
      if (createError && createError.code === 'PGRST116') {
        console.log('📝 Table does not exist, creating manually...');
        
        // Create table directly
        const { error: directError } = await supabase.rpc('create_qr_scans_table_if_not_exists');
        
        if (directError) {
          console.error('❌ Error with direct creation:', directError);
          return false;
        }
      }
    }

    console.log('✅ QR scans table setup completed successfully');

    // Test the table by checking if it exists
    const { data, error: testError } = await supabase
      .from('qr_scans')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing QR scans table:', testError);
      console.log('ℹ️  This might be normal if the table was just created');
    } else {
      console.log('✅ QR scans table is working correctly');
    }
    
    return true;

  } catch (error) {
    console.error('❌ Error in setupQRScansTable:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setupQRScansTable()
    .then(success => {
      if (success) {
        console.log('🎉 QR scans table setup completed!');
        process.exit(0);
      } else {
        console.log('❌ QR scans table setup failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Setup error:', error);
      process.exit(1);
    });
}

module.exports = { setupQRScansTable };