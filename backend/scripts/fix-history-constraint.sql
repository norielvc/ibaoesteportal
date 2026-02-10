-- Fix check constraint on workflow_history to allow 'natural_death'
-- This script removes the old constraint and adds a new one including Natural Death.

ALTER TABLE workflow_history 
DROP CONSTRAINT IF EXISTS chk_history_request_type;

ALTER TABLE workflow_history 
ADD CONSTRAINT chk_history_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'note'
));

-- Verify
SELECT DISTINCT request_type FROM workflow_history;
