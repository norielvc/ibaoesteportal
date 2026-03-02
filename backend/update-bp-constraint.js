const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateConstraint() {
    const sql = `
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;

ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_certificate_type_check
CHECK (certificate_type IN (
    'barangay_clearance',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit'
));
    `;
    console.log('Executing SQL to update certificate_type constraint...');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error('RPC Error:', error);
            console.log('--- MANUAL ACTION REQUIRED ---');
            console.log('Run this SQL in the Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('✅ Successfully updated constraint via RPC');
        }
    } catch (e) {
        console.log('RPC failed, likely not available.');
        console.log('--- MANUAL ACTION REQUIRED ---');
        console.log('Run this SQL in the Supabase SQL Editor:');
        console.log(sql);
    }
}

updateConstraint();
