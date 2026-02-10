const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function repairAssignments() {
    console.log('🚀 Repairing assignments for Natural Death Certificates...');

    // 1. Fetch the Natural Death workflow config
    const { data: workflow, error: wfError } = await supabase
        .from('workflow_configurations')
        .select('*')
        .eq('certificate_type', 'natural_death')
        .single();

    if (wfError || !workflow) {
        console.error('❌ Natural Death workflow not found. Please run the SQL script first.', wfError);
        return;
    }

    const steps = workflow.workflow_config?.steps || workflow.steps;
    if (!steps || steps.length === 0) {
        console.error('❌ No steps found in workflow configuration.');
        return;
    }

    // 2. Find all natural_death requests that are in an active state
    const { data: requests, error: reqError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number, status')
        .eq('certificate_type', 'natural_death')
        .in('status', ['staff_review', 'processing', 'oic_review', 'pending', 'captain_approval', 'secretary_approval', 'ready', 'ready_for_pickup']);

    if (reqError) {
        console.error('❌ Error fetching requests:', reqError);
        return;
    }

    console.log(`Found ${requests.length} active Natural Death requests.`);

    for (const request of requests) {
        console.log(`Processing ${request.reference_number} (${request.status})...`);

        // Determine target step based on status
        let targetStep = null;
        const s = request.status.toLowerCase();

        if (['staff_review', 'pending', 'submitted'].includes(s)) {
            targetStep = steps[0]; // Review Request Team
        } else if (['oic_review', 'ready', 'ready_for_pickup'].includes(s)) {
            targetStep = steps.find(st => st.status === 'oic_review');
        } else if (s === 'secretary_approval') {
            targetStep = steps.find(st => st.status === 'secretary_approval');
        } else if (s === 'captain_approval') {
            targetStep = steps.find(st => st.status === 'captain_approval');
        } else {
            // For processing, try to find the next logical step
            targetStep = steps.find(st => st.status === s) || steps[0];
        }

        if (!targetStep) {
            console.log(`⚠️ No target step found for status ${request.status}. Skipping.`);
            continue;
        }

        const assignedUsers = targetStep.assignedUsers || [];
        if (assignedUsers.length === 0) {
            console.log(`⚠️ No users assigned to step ${targetStep.name}. Skipping.`);
            continue;
        }

        // 3. Create assignments for each user
        for (const userId of assignedUsers) {
            // Check if assignment already exists
            const { data: existing, error: checkError } = await supabase
                .from('workflow_assignments')
                .select('id')
                .eq('request_id', request.id)
                .eq('assigned_user_id', userId)
                .eq('status', 'pending')
                .limit(1);

            if (existing && existing.length > 0) {
                console.log(`- User ${userId} already assigned to ${request.reference_number}.`);
                continue;
            }

            const { error: insertError } = await supabase
                .from('workflow_assignments')
                .insert([{
                    request_id: request.id,
                    request_type: 'natural_death',
                    step_id: targetStep.id.toString(),
                    step_name: targetStep.name,
                    assigned_user_id: userId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.error(`❌ Failed to create assignment for ${userId}:`, insertError);
            } else {
                console.log(`✅ Assigned User ${userId} to ${request.reference_number} (${targetStep.name})`);
            }
        }
    }

    console.log('🏁 Repair complete.');
}

repairAssignments();
