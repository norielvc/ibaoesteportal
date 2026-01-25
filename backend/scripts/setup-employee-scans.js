const { supabase } = require('../services/supabaseClient');

async function setupEmployeeScansTable() {
  try {
    console.log('📊 Setting up employee_scans table...');
    
    // Create the table directly with Supabase client
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create employee_scans table for storing QR scan data
        CREATE TABLE IF NOT EXISTS employee_scans (
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
        CREATE INDEX IF NOT EXISTS idx_employee_scans_timestamp ON employee_scans(scan_timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_employee_scans_qr_data ON employee_scans(qr_data);
        CREATE INDEX IF NOT EXISTS idx_employee_scans_scanned_by ON employee_scans(scanned_by);
        CREATE INDEX IF NOT EXISTS idx_employee_scans_created_at ON employee_scans(created_at DESC);

        -- Grant permissions
        GRANT ALL ON employee_scans TO authenticated;
        GRANT ALL ON employee_scans TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE employee_scans_id_seq TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE employee_scans_id_seq TO service_role;
      `
    });
    
    if (error) {
      console.error('❌ Error creating table:', error);
    } else {
      console.log('✅ Employee scans table created successfully');
    }
    
  } catch (err) {
    console.error('❌ Setup error:', err);
  }
}

// Run if called directly
if (require.main === module) {
  setupEmployeeScansTable().then(() => process.exit(0));
}

module.exports = { setupEmployeeScansTable };