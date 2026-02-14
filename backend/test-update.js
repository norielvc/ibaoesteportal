const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateRequest() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .update({
            partner_full_name: 'TEST PARTNER NAME',
            partner_age: 30,
            partner_sex: 'FEMALE',
            partner_date_of_birth: '1995-05-05'
        })
        .eq('reference_number', 'CH-2026-00001')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Successfully updated CH-2026-00001');
        console.log(data[0]);
    }
}

updateRequest();
