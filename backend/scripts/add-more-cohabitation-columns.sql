const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
    console.log('Adding partner_address and partner_civil_status columns...');
    
    // Using RPC or raw query if possible, but let's try direct ALTER via a script if we can.
    // Since I don't have a direct postgres tool, I'll use the 'touch-table' trick or just assume I can run SQL via migrations if there's a system for it.
    // Actually, I can try to run a raw SQL query through Supabase if there's an RPC for it, but usually there isn't for security.
    
    console.log('Please run the following SQL in Supabase Dashboard:');
    console.log('ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_address TEXT;');
    console.log('ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_civil_status TEXT;');
}

addColumns();
