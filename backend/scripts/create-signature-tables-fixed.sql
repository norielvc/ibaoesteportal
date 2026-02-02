-- Create user_signatures table
CREATE TABLE IF NOT EXISTS user_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    name VARCHAR(255) NOT NULL DEFAULT 'Signature',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    default_signature_id UUID REFERENCES user_signatures(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_signatures_user_id ON user_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signatures_created_at ON user_signatures(created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Add signature column to existing certificate tables (check which ones exist first)
-- For certificate_requests table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificate_requests') THEN
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS applicant_signature TEXT;
        CREATE INDEX IF NOT EXISTS idx_certificate_requests_signature ON certificate_requests(applicant_signature) WHERE applicant_signature IS NOT NULL;
    END IF;
END $$;

-- For certificates table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
        ALTER TABLE certificates ADD COLUMN IF NOT EXISTS applicant_signature TEXT;
        CREATE INDEX IF NOT EXISTS idx_certificates_signature ON certificates(applicant_signature) WHERE applicant_signature IS NOT NULL;
    END IF;
END $$;

-- For educational_assistance table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'educational_assistance') THEN
        ALTER TABLE educational_assistance ADD COLUMN IF NOT EXISTS applicant_signature TEXT;
        CREATE INDEX IF NOT EXISTS idx_educational_assistance_signature ON educational_assistance(applicant_signature) WHERE applicant_signature IS NOT NULL;
    END IF;
END $$;