const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('certificate_type', 'barangay_cohabitation')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent Cohabitation Requests:');
        data.forEach(r => {
            console.log(`ID: ${r.id}, Ref: ${r.reference_number}`);
            console.log(`  Partner: ${r.partner_full_name}, Age: ${r.partner_age}, Sex: ${r.partner_sex}`);
            console.log(`  Children: ${r.no_of_children}, Yrs: ${r.living_together_years}, Mos: ${r.living_together_months}`);
        });
    }
}

checkData();
