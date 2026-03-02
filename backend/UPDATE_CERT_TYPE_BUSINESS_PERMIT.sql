-- Update certificate_type check constraint to include 'business_permit'
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;

ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_certificate_type_check
CHECK (certificate_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit'
));
