-- Create user_signatures table
CREATE TABLE IF NOT EXISTS user_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    name VARCHAR(255) NOT NULL DEFAULT 'Signature',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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

-- Policy for user_signatures: Users can only access their own signatures
CREATE POLICY "Users can view their own signatures" ON user_signatures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own signatures" ON user_signatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures" ON user_signatures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures" ON user_signatures
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for user_settings: Users can only access their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Add signature column to existing certificate tables
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS applicant_signature TEXT;
ALTER TABLE educational_assistance ADD COLUMN IF NOT EXISTS applicant_signature TEXT;

-- Add indexes for signature columns
CREATE INDEX IF NOT EXISTS idx_certificates_signature ON certificates(applicant_signature) WHERE applicant_signature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_educational_assistance_signature ON educational_assistance(applicant_signature) WHERE applicant_signature IS NOT NULL;