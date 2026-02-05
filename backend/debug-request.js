const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRequest() {
    console.log('Checking request BC-2026-00023...');

    // 1. Get the request
    const { data: req, error: reqError } = await supabase
        .from('certificate_requests')
        .select('id, full_name, resident_id, residents:resident_id(id, pending_case)')
        .eq('reference_number', 'BC-2026-00023')
        .single();

    if (reqError) {
        console.error('Error fetching request:', reqError);
        return;
    }

    console.log('Request Data:', JSON.stringify(req, null, 2));

    if (!req.resident_id) {
        console.log('❌ resident_id is NULL. This is why the warning is missing.');
        console.log('Attempting to find matching resident...');

        // 2. Try to find the resident by name
        const { data: res, error: resError } = await supabase
            .from('residents')
            .select('id, full_name, pending_case')
            // Try fuzzy or exact match. Let's try simple ilike first
            .ilike('full_name', req.full_name)
            .limit(1);

        if (res && res.length > 0) {
            console.log('✅ Found matching resident:', res[0]);
            console.log('RECOMMENDATION: Run backfill script to link these records.');
        } else {
            console.log('⚠️ No exact name match found in residents table.');
        }
    } else {
        console.log('✅ resident_id is present.');
        console.log('Pending Case Status:', req.residents?.pending_case);
    }
}

checkRequest();
