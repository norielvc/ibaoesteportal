-- Fix check constraint on workflow_assignments to allow 'natural_death'
-- This script removes the old constraint and adds a new one including Natural Death.

ALTER TABLE workflow_assignments 
DROP CONSTRAINT IF EXISTS chk_request_type;

ALTER TABLE workflow_assignments 
ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death'
));

-- Verify
SELECT DISTINCT request_type FROM workflow_assignments;
