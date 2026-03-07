-- Fix workflow_assignments constraint to include business_permit
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;

-- Step 2: Create new constraint with business_permit included
ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type CHECK (
  request_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'certification_same_person',
    'natural_death',
    'barangay_guardianship',
    'barangay_residency',
    'medico_legal',
    'business_permit',
    'barangay_cohabitation'
  )
);

-- Step 3: Verify the constraint was created successfully
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'chk_request_type';