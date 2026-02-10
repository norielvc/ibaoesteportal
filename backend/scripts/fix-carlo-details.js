const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDetails() {
    console.log('Fixing details for Carlo Navarro Mendoza...');

    // 1. Update Resident Record
    const { error: resErr } = await supabase
        .from('residents')
        .update({
            gender: 'MALE',
            first_name: 'Carlo',
            middle_name: 'Navarro',
            last_name: 'Mendoza',
            updated_at: new Date().toISOString()
        })
        .eq('id', '11d76972-63ab-427e-abd0-820846f6ad15');

    if (resErr) console.error('Error updating resident:', resErr);
    else console.log('Resident record updated to MALE.');

    // 2. Update Certificate Request record
    const { error: reqErr } = await supabase
        .from('certificate_requests')
        .update({
            sex: 'MALE',
            first_name: 'Carlo',
            middle_name: 'Navarro',
            last_name: 'Mendoza',
            date_of_birth: '1963-05-25',
            place_of_birth: 'Davao City',
            updated_at: new Date().toISOString()
        })
        .eq('reference_number', 'ND-2026-00002');

    if (reqErr) console.error('Error updating request:', reqErr);
    else console.log('Certificate request ND-2026-00002 updated with correct details.');
}

fixDetails();
