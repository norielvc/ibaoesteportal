-- =====================================================
-- PHYSICAL INSPECTION REPORTS TABLE FOR BUSINESS PERMITS
-- =====================================================
-- This script creates the physical_inspection_reports table
-- Run this in Supabase SQL Editor

-- 1. PHYSICAL_INSPECTION_REPORTS TABLE
-- Stores detailed inspection findings for business permit applications
CREATE TABLE IF NOT EXISTS physical_inspection_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL UNIQUE,
    certificate_type VARCHAR(50) DEFAULT 'business_permit',
    
    -- Visit Information
    visit_datetime TIMESTAMP WITH TIME ZONE,
    owner_representative VARCHAR(255),
    
    -- Inspection Areas (JSON for flexibility)
    inspection_areas JSONB DEFAULT '{}',
    
    -- Committee Recommendations (JSON for flexibility)
    committee_recommendations JSONB DEFAULT '{}',
    
    -- Overall Status
    inspection_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'completed', 'approved'
    overall_recommendation VARCHAR(20), -- 'approve', 'reject', 'conditional'
    inspector_notes TEXT,
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_inspection_request FOREIGN KEY (request_id) REFERENCES certificate_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_inspection_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inspection_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Check constraints
    CONSTRAINT chk_inspection_status CHECK (inspection_status IN ('draft', 'completed', 'approved')),
    CONSTRAINT chk_overall_recommendation CHECK (overall_recommendation IN ('approve', 'reject', 'conditional'))
);

-- 2. INSPECTION_AREA_FINDINGS TABLE
-- Stores individual area findings (normalized approach)
CREATE TABLE IF NOT EXISTS inspection_area_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inspection_report_id UUID NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    findings TEXT,
    inspection_date DATE,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'satisfactory', 'needs_improvement', 'non_compliant'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_area_inspection_report FOREIGN KEY (inspection_report_id) REFERENCES physical_inspection_reports(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_area_status CHECK (status IN ('pending', 'satisfactory', 'needs_improvement', 'non_compliant')),
    
    -- Unique constraint to prevent duplicate areas per report
    CONSTRAINT uk_inspection_area UNIQUE (inspection_report_id, area_name)
);

-- 3. COMMITTEE_RECOMMENDATIONS TABLE
-- Stores committee member recommendations
CREATE TABLE IF NOT EXISTS committee_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inspection_report_id UUID NOT NULL,
    committee_name VARCHAR(100) NOT NULL,
    signatory_name VARCHAR(255),
    recommendation_date DATE,
    recommendation VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approve', 'reject', 'conditional'
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_committee_inspection_report FOREIGN KEY (inspection_report_id) REFERENCES physical_inspection_reports(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_committee_recommendation CHECK (recommendation IN ('pending', 'approve', 'reject', 'conditional')),
    
    -- Unique constraint to prevent duplicate committee recommendations per report
    CONSTRAINT uk_committee_recommendation UNIQUE (inspection_report_id, committee_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Physical inspection reports indexes
CREATE INDEX IF NOT EXISTS idx_inspection_reports_request_id ON physical_inspection_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_status ON physical_inspection_reports(inspection_status);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_created_at ON physical_inspection_reports(created_at);

-- Area findings indexes
CREATE INDEX IF NOT EXISTS idx_area_findings_report_id ON inspection_area_findings(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_area_findings_area_name ON inspection_area_findings(area_name);
CREATE INDEX IF NOT EXISTS idx_area_findings_status ON inspection_area_findings(status);

-- Committee recommendations indexes
CREATE INDEX IF NOT EXISTS idx_committee_recommendations_report_id ON committee_recommendations(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_committee_recommendations_committee ON committee_recommendations(committee_name);
CREATE INDEX IF NOT EXISTS idx_committee_recommendations_recommendation ON committee_recommendations(recommendation);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Update timestamp trigger for physical_inspection_reports
CREATE OR REPLACE FUNCTION update_physical_inspection_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_physical_inspection_reports_updated_at
    BEFORE UPDATE ON physical_inspection_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_physical_inspection_reports_updated_at();

-- Update timestamp trigger for inspection_area_findings
CREATE OR REPLACE FUNCTION update_inspection_area_findings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inspection_area_findings_updated_at
    BEFORE UPDATE ON inspection_area_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_area_findings_updated_at();

-- Update timestamp trigger for committee_recommendations
CREATE OR REPLACE FUNCTION update_committee_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_committee_recommendations_updated_at
    BEFORE UPDATE ON committee_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_recommendations_updated_at();

-- =====================================================
-- SAMPLE DATA INSERTION (OPTIONAL)
-- =====================================================

-- Insert default inspection areas for business permits
INSERT INTO inspection_area_findings (inspection_report_id, area_name, findings, inspection_date, remarks, status)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID, -- This will be replaced with actual report IDs
    area_name,
    '',
    NULL,
    '',
    'pending'
FROM (VALUES 
    ('HEALTH AND SAFETY'),
    ('SANITATION'),
    ('HEALTH HAZARD'),
    ('BUILDING PERMIT'),
    ('FIRE EXIT / HAZARD'),
    ('ENVIRONMENT'),
    ('WASTE MANAGEMENT'),
    ('HAZARDOUS WASTE'),
    ('OTHERS'),
    ('COMPLAINTS, ETC.')
) AS areas(area_name)
WHERE NOT EXISTS (SELECT 1 FROM inspection_area_findings LIMIT 1); -- Only insert if table is empty

-- Insert default committee types
INSERT INTO committee_recommendations (inspection_report_id, committee_name, signatory_name, recommendation_date, recommendation, comments)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID, -- This will be replaced with actual report IDs
    committee_name,
    '',
    NULL,
    'pending',
    ''
FROM (VALUES 
    ('HEALTH'),
    ('ENVIRONMENT'),
    ('INFRASTRUCTURE'),
    ('PEACE & ORDER')
) AS committees(committee_name)
WHERE NOT EXISTS (SELECT 1 FROM committee_recommendations LIMIT 1); -- Only insert if table is empty