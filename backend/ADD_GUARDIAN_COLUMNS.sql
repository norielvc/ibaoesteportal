-- Add guardian columns to residents table to support Guardianship Certificate sync
-- Run this in Supabase SQL Editor

ALTER TABLE residents ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;

COMMENT ON COLUMN residents.guardian_name IS 'Name of the guardian for minors or PWDs';
COMMENT ON COLUMN residents.guardian_relationship IS 'Relationship of the guardian to the resident';
