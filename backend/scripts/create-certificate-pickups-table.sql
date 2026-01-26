-- Create certificate pickups table for tracking pickup process
CREATE TABLE IF NOT EXISTS certificate_pickups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES certificate_requests(id) ON DELETE CASCADE,
    pickup_token VARCHAR(255) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    picked_up_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_pickups_request_id ON certificate_pickups(request_id);
CREATE INDEX IF NOT EXISTS idx_certificate_pickups_pickup_token ON certificate_pickups(pickup_token);
CREATE INDEX IF NOT EXISTS idx_certificate_pickups_status ON certificate_pickups(status);
CREATE INDEX IF NOT EXISTS idx_certificate_pickups_expires_at ON certificate_pickups(expires_at);

-- Add comments for documentation
COMMENT ON TABLE certificate_pickups IS 'Tracks certificate pickup process with QR codes';
COMMENT ON COLUMN certificate_pickups.request_id IS 'Reference to the certificate request';
COMMENT ON COLUMN certificate_pickups.pickup_token IS 'Unique token for pickup verification';
COMMENT ON COLUMN certificate_pickups.qr_code_data IS 'JSON data encoded in the QR code';
COMMENT ON COLUMN certificate_pickups.status IS 'Pickup status (pending, completed, expired)';
COMMENT ON COLUMN certificate_pickups.expires_at IS 'When the pickup token expires';
COMMENT ON COLUMN certificate_pickups.picked_up_at IS 'When the certificate was actually picked up';
COMMENT ON COLUMN certificate_pickups.picked_up_by IS 'Name of person who picked up the certificate';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_certificate_pickups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificate_pickups_updated_at
    BEFORE UPDATE ON certificate_pickups
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_pickups_updated_at();