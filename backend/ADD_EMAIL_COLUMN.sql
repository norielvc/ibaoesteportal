-- Add email column to certificate_requests table to support guest notifications
-- Run this in Supabase SQL Editor

ALTER TABLE certificate_requests
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN certificate_requests.email IS 'Email address of the requestor for notifications (especially for guests/walk-ins)';

-- Optional: Update existing records if possible (requires matching with users table)
UPDATE certificate_requests cr
SET email = u.email
FROM users u
WHERE cr.resident_id = u.id
AND cr.email IS NULL;
