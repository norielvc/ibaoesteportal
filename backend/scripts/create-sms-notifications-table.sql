-- Create SMS notifications table for tracking SMS messages
CREATE TABLE IF NOT EXISTS sms_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES certificate_requests(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    message_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_notifications_request_id ON sms_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_sent_at ON sms_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_phone_number ON sms_notifications(phone_number);

-- Add comments for documentation
COMMENT ON TABLE sms_notifications IS 'Tracks SMS notifications sent to certificate applicants';
COMMENT ON COLUMN sms_notifications.request_id IS 'Reference to the certificate request';
COMMENT ON COLUMN sms_notifications.phone_number IS 'Recipient phone number in international format';
COMMENT ON COLUMN sms_notifications.message IS 'SMS message content';
COMMENT ON COLUMN sms_notifications.provider IS 'SMS service provider (twilio, semaphore, mock)';
COMMENT ON COLUMN sms_notifications.message_id IS 'Provider-specific message ID for tracking';
COMMENT ON COLUMN sms_notifications.status IS 'Message status (pending, sent, failed, delivered)';
COMMENT ON COLUMN sms_notifications.error_message IS 'Error details if sending failed';

-- Insert sample data for testing
INSERT INTO sms_notifications (request_id, phone_number, message, provider, message_id, status) 
SELECT 
    id,
    '+639171234567',
    'Sample SMS notification for testing',
    'mock',
    'mock_' || extract(epoch from now()),
    'sent'
FROM certificate_requests 
WHERE status = 'ready_for_pickup' 
LIMIT 1
ON CONFLICT DO NOTHING;