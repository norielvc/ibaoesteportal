const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDetails() {
    console.log('Fixing full details for Carlo Navarro Mendoza (ND-2026-00002)...');

    const { error: reqErr } = await supabase
        .from('certificate_requests')
        .update({
            date_of_death: '2026-02-09',
            cause_of_death: 'HEART ATTACK',
            covid_related: false,
            requestor_name: 'TEST TRY SAMPLE',
            updated_at: new Date().toISOString()
        })
        .eq('reference_number', 'ND-2026-00002');

    if (reqErr) console.error('Error updating request:', reqErr);
    else console.log('Certificate request ND-2026-00002 fixed with all natural death details.');
}

fixDetails();
