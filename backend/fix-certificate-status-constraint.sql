-- Fix certificate_requests status constraint
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';

-- Step 2: Drop the existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- Step 3: Create new constraint with all required status values
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check CHECK (
  status IN (
    'pending',
    'submitted',
    'staff_review',
    'processing',
    'secretary_approval',
    'captain_approval',
    'physical_inspection',
    'approved',
    'ready',
    'ready_for_pickup',
    'released',
    'rejected',
    'returned',
    'oic_review',
    'completed'
  )
);

-- Step 4: Verify the constraint was created successfully
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';