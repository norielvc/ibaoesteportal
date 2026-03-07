-- ============================================================
-- FIX: Add 'business_permit' to the workflow_assignments check constraint
-- The chk_request_type constraint is blocking business_permit inserts!
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the old constraint
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;

-- Step 2: Re-create the constraint with business_permit included
ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type CHECK (
  request_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'certification_same_person',
    'natural_death',
    'barangay_guardianship',
    'barangay_residency',
    'medico_legal',
    'business_permit'
  )
);

-- Step 3: Verify it works by checking the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'chk_request_type';
