-- Add file_path column to official_receipts table to store the actual OR file path
ALTER TABLE official_receipts ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);

-- Create index for file_path
CREATE INDEX IF NOT EXISTS idx_official_receipts_file_path ON official_receipts(file_path);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'official_receipts' AND column_name = 'file_path';