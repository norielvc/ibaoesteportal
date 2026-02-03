const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOfficials() {
    console.log('🔍 Inspecting barangay_officials table...');

    const { data, error } = await supabase
        .from('barangay_officials')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found', data.length, 'officials:');
    data.forEach(o => {
        console.log(`[ID: ${o.id}] Type: ${o.position_type}, Position: "${o.position}", Order: ${o.order_index}, Name: "${o.name}"`);
    });
}

debugOfficials();
