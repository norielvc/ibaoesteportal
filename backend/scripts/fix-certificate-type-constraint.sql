-- The error "violates check constraint certificate_requests_certificate_type_check" happens because
-- the database only allows specific values for 'certificate_type', and 'natural_death' is not in that list yet.

-- 1. First, remove the old restriction
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;

-- 2. Add the new restriction that INCLUDES 'natural_death'
-- Note: We include existing types plus the new one.
ALTER TABLE certificate_requests 
ADD CONSTRAINT certificate_requests_certificate_type_check 
CHECK (certificate_type IN (
    'barangay_clearance',
    'barangay_residency',
    'certificate_of_indigency',
    'natural_death'
));

-- 3. Verify it works
-- You can now insert records with 'natural_death' type.
