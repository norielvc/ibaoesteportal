-- Fix check constraint on workflow_history to allow 'barangay_guardianship'
-- This script removes the old constraint and adds a new one including Guardianship.

ALTER TABLE workflow_history 
DROP CONSTRAINT IF EXISTS chk_history_request_type;

ALTER TABLE workflow_history 
ADD CONSTRAINT chk_history_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'note'
));

-- Also double check workflow_assignments just in case
ALTER TABLE workflow_assignments 
DROP CONSTRAINT IF EXISTS chk_request_type;

ALTER TABLE workflow_assignments 
ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship'
));

-- Verify
SELECT DISTINCT request_type FROM workflow_history;
