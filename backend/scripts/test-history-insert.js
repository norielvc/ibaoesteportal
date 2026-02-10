const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const requestId = 'a01c46e2-26e3-41e5-b7cf-713123186233'; // ND-2026-00002
    const userId = '1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae'; // Luffy Dono

    console.log('Test inserting into workflow_history...');

    const { data, error } = await supabase
        .from('workflow_history')
        .insert([{
            request_id: requestId,
            request_type: 'natural_death',
            step_id: 1,
            step_name: 'Test Step',
            action: 'approve',
            performed_by: userId,
            previous_status: 'staff_review',
            new_status: 'processing',
            comments: 'This is a test comment',
            official_role: 'Staff'
        }])
        .select();

    if (error) {
        console.error('❌ Insert failed:', error);
    } else {
        console.log('✅ Insert successful:', data);
    }
}

testInsert();
