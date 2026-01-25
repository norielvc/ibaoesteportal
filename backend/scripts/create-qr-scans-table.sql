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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_qr_scans_updated_at ON qr_scans;
CREATE TRIGGER update_qr_scans_updated_at
    BEFORE UPDATE ON qr_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_scans_updated_at();

-- Create RPC function for creating table (used by the API)
CREATE OR REPLACE FUNCTION create_qr_scans_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- This function is called by the API to ensure table exists
    -- The actual table creation is handled above
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON qr_scans TO authenticated;
GRANT ALL ON qr_scans TO service_role;
GRANT USAGE, SELECT ON SEQUENCE qr_scans_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE qr_scans_id_seq TO service_role;

-- Create view for scan statistics
CREATE OR REPLACE VIEW qr_scan_stats AS
SELECT 
    DATE(scan_timestamp) as scan_date,
    COUNT(*) as total_scans,
    COUNT(DISTINCT qr_data) as unique_qr_codes,
    COUNT(DISTINCT scanned_by) as unique_scanners,
    MIN(scan_timestamp) as first_scan,
    MAX(scan_timestamp) as last_scan
FROM qr_scans
GROUP BY DATE(scan_timestamp)
ORDER BY scan_date DESC;

-- Grant access to the view
GRANT SELECT ON qr_scan_stats TO authenticated;
GRANT SELECT ON qr_scan_stats TO service_role;

COMMENT ON TABLE qr_scans IS 'Stores general QR code scan data';
COMMENT ON COLUMN qr_scans.qr_data IS 'The QR code data that was scanned';
COMMENT ON COLUMN qr_scans.scan_timestamp IS 'When the QR code was scanned';
COMMENT ON COLUMN qr_scans.scanner_type IS 'Type of scanner used (mobile, desktop, etc.)';
COMMENT ON COLUMN qr_scans.device_info IS 'JSON data about the device used for scanning';
COMMENT ON COLUMN qr_scans.scanned_by IS 'ID of the user who performed the scan';