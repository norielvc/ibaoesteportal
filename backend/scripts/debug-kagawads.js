const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKagawads() {
    console.log('🔍 Inspecting KAGAWAD entries...');

    const { data, error } = await supabase
        .from('barangay_officials')
        .select('*')
        .eq('position_type', 'kagawad')
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found', data.length, 'Kagawads:');
    data.forEach(o => {
        console.log(`idx:${o.order_index} | Pos:"${o.position}" | Name:"${o.name}"`);
    });
}

debugKagawads();
