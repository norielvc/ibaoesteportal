-- Drop the existing constraint for workflow_configurations
ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS chk_config_certificate_type;

-- Re-add the constraint with the new 'certification_same_person' type included
ALTER TABLE workflow_configurations ADD CONSTRAINT chk_config_certificate_type
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
