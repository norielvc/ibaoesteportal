-- Fix check constraints on all workflow tables to allow 'medico_legal'

-- 1. workflow_configurations
ALTER TABLE workflow_configurations 
DROP CONSTRAINT IF EXISTS chk_config_certificate_type;

ALTER TABLE workflow_configurations 
ADD CONSTRAINT chk_config_certificate_type 
CHECK (certificate_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal'
));

-- 2. workflow_assignments
ALTER TABLE workflow_assignments 
DROP CONSTRAINT IF EXISTS chk_request_type;

ALTER TABLE workflow_assignments 
ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal'
));

-- 3. workflow_history
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
  'barangay_cohabitation',
  'medico_legal',
  'note'
));

-- 4. certificate_requests (certificate_type)
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS chk_certificate_type;

ALTER TABLE certificate_requests 
ADD CONSTRAINT chk_certificate_type 
CHECK (certificate_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal'
));
