-- Add details column if not exists
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
