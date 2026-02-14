-- 1. Certificate Requests Table (Safe to re-run)
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
    'certification_same_person'
));

-- 2. Workflow Assignments Table (Safe to re-run)
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;
ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type
CHECK (request_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person'
));

-- 3. Workflow History Table (UPDATED to include 'note')
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_workflow_history_request_type;
ALTER TABLE workflow_history ADD CONSTRAINT chk_workflow_history_request_type
CHECK (request_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'note'
));
