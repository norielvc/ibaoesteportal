-- Add columns for Medico Legal Request to certificate_requests table
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS date_of_examination DATE;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS usaping_barangay TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS date_of_hearing DATE;

-- Update constraint to allow medico_legal type
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;

ALTER TABLE certificate_requests 
ADD CONSTRAINT certificate_requests_certificate_type_check 
CHECK (certificate_type IN (
    'barangay_clearance',
    'barangay_residency',
    'certificate_of_indigency',
    'natural_death',
    'barangay_guardianship',
    'barangay_cohabitation',
    'medico_legal'
));

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'certificate_requests' 
AND column_name IN ('date_of_examination', 'usaping_barangay', 'date_of_hearing');
