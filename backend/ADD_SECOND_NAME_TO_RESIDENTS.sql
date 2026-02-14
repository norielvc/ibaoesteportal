-- Add Second Name column to residents table
ALTER TABLE residents ADD COLUMN IF NOT EXISTS second_name TEXT;
