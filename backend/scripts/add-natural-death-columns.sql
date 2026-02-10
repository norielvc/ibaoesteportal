-- Add columns for Natural Death Certificate to certificate_requests table

ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS date_of_death TIMESTAMP WITH TIME ZONE;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS cause_of_death TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS covid_related BOOLEAN DEFAULT FALSE;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS requestor_name TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'certificate_requests' 
AND column_name IN ('date_of_death', 'cause_of_death', 'covid_related', 'requestor_name');
