const path = require('path');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRequest() {
    console.log('--- Request Details for ND-2026-00002 ---');
    const { data: request, error: reqErr } = await supabase
        .from('certificate_requests')
        .select('*, residents(*)')
        .eq('reference_number', 'ND-2026-00002')
        .single();

    if (reqErr) {
        console.error('Error fetching request:', reqErr);
        return;
    }

    console.log('Request Data:', JSON.stringify(request, null, 2));

    if (request.residents) {
        console.log('\n--- Resident Data (Directly from Residents table) ---');
        console.log('Full Name:', request.residents.full_name);
        console.log('Sex:', request.residents.gender);
        console.log('Date of Birth:', request.residents.date_of_birth);
        console.log('Place of Birth:', request.residents.place_of_birth);
        console.log('Civil Status:', request.residents.civil_status);
    } else {
        console.log('\nNo matching resident record found in residents table.');
    }

    // Also check if there's any other resident with the same name
    const { data: otherResidents, error: otherErr } = await supabase
        .from('residents')
        .select('*')
        .ilike('full_name', '%Carlo Navarro Mendoza%');

    if (otherResidents && otherResidents.length > 0) {
        console.log('\n--- Other Matching Residents ---');
        console.log(JSON.stringify(otherResidents, null, 2));
    }
}

checkRequest();
