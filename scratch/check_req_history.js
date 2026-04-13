const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRequestHistory(refNo) {
    console.log(`Checking history for request: ${refNo}`);
    
    // 1. Get Request ID
    const { data: request, error: reqError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number')
        .eq('reference_number', refNo)
        .single();
        
    if (reqError || !request) {
        console.error('Request not found:', reqError);
        return;
    }
    
    console.log(`Found ID: ${request.id}`);
    
    // 2. Get History
    const { data: history, error: histError } = await supabase
        .from('workflow_history')
        .select('*, users:performed_by (first_name, last_name, employee_code)')
        .eq('request_id', request.id)
        .order('created_at', { ascending: false });
        
    if (histError) {
        console.error('History error:', histError);
        return;
    }
    
    console.log(`Found ${history.length} history records.`);
    
    history.forEach(h => {
        console.log(`- Action: ${h.action}, Step: ${h.step_name}, By: ${h.users?.first_name} ${h.users?.last_name}, Code: ${h.users?.employee_code}`);
    });
}

checkRequestHistory('CI-2026-91256');
