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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_employee_scans_updated_at ON employee_scans;
CREATE TRIGGER update_employee_scans_updated_at
    BEFORE UPDATE ON employee_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_scans_updated_at();

-- Create RPC function for creating table (used by the API)
CREATE OR REPLACE FUNCTION create_employee_scans_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- This function is called by the API to ensure table exists
    -- The actual table creation is handled above
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data for testing (optional)
-- INSERT INTO employee_scans (qr_data, scan_timestamp, scanner_type, scanned_by) VALUES
-- ('EMP001', NOW(), 'mobile', 1),
-- ('EMP002', NOW() - INTERVAL '1 hour', 'mobile', 1),
-- ('EMP003', NOW() - INTERVAL '2 hours', 'mobile', 1);

-- Grant permissions
GRANT ALL ON employee_scans TO authenticated;
GRANT ALL ON employee_scans TO service_role;
GRANT USAGE, SELECT ON SEQUENCE employee_scans_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE employee_scans_id_seq TO service_role;

-- Create view for scan statistics
CREATE OR REPLACE VIEW employee_scan_stats AS
SELECT 
    DATE(scan_timestamp) as scan_date,
    COUNT(*) as total_scans,
    COUNT(DISTINCT qr_data) as unique_employees,
    COUNT(DISTINCT scanned_by) as unique_scanners,
    MIN(scan_timestamp) as first_scan,
    MAX(scan_timestamp) as last_scan
FROM employee_scans
GROUP BY DATE(scan_timestamp)
ORDER BY scan_date DESC;

-- Grant access to the view
GRANT SELECT ON employee_scan_stats TO authenticated;
GRANT SELECT ON employee_scan_stats TO service_role;

COMMENT ON TABLE employee_scans IS 'Stores QR code scan data for employee tracking';
COMMENT ON COLUMN employee_scans.qr_data IS 'The QR code data that was scanned';
COMMENT ON COLUMN employee_scans.scan_timestamp IS 'When the QR code was scanned';
COMMENT ON COLUMN employee_scans.scanner_type IS 'Type of scanner used (mobile, desktop, etc.)';
COMMENT ON COLUMN employee_scans.device_info IS 'JSON data about the device used for scanning';
COMMENT ON COLUMN employee_scans.scanned_by IS 'ID of the user who performed the scan';