const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCH00002() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('reference_number', 'CH-2026-00002')
        .single();

    if (error) {
        console.error('Error fetching CH-2026-00002:', error.message);
    } else {
        console.log('--- CH-2026-00002 DATABASE CONTENT ---');
        console.log('Partner Name:', data.partner_full_name);
        console.log('Partner Age:', data.partner_age);
        console.log('Partner Sex:', data.partner_sex);
        console.log('Partner DOB:', data.partner_date_of_birth);
        console.log('All Partner Keys:', Object.keys(data).filter(k => k.startsWith('partner_')));
    }
}

checkCH00002();
