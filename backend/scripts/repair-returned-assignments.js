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

async function repairReturnedRequests() {
    console.log('🚀 Repairing assignments for RETURNED requests...');

    // 1. Find all requests with status 'returned'
    const { data: requests, error: reqError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number, certificate_type, status')
        .eq('status', 'returned');

    if (reqError) {
        console.error('❌ Error fetching requests:', reqError);
        return;
    }

    console.log(`Found ${requests.length} requests with status "returned".`);

    // 2. Load workflow configs
    const { data: configs } = await supabase.from('workflow_configurations').select('*');
    const configMap = configs.reduce((acc, c) => {
        acc[c.certificate_type] = c.workflow_config?.steps || [];
        return acc;
    }, {});

    for (const request of requests) {
        console.log(`Checking ${request.reference_number}...`);

        const steps = configMap[request.certificate_type] || [];
        if (steps.length === 0) {
            console.log(`⚠️ No workflow config for ${request.certificate_type}. Skipping.`);
            continue;
        }

        // Target the first step (Review Team) for returned requests
        const targetStep = steps[0];
        const assignedUsers = targetStep.assignedUsers || [];

        for (const userId of assignedUsers) {
            // Check if there is already a PENDING assignment
            const { data: pending } = await supabase
                .from('workflow_assignments')
                .select('id')
                .eq('request_id', request.id)
                .eq('step_id', targetStep.id.toString())
                .eq('assigned_user_id', userId)
                .eq('status', 'pending');

            if (pending && pending.length > 0) {
                console.log(`✅ ${request.reference_number} already has a pending assignment for user ${userId}.`);
                continue;
            }

            // Create the pending assignment
            console.log(`➕ Creating pending assignment for ${request.reference_number} -> User ${userId}`);
            const { error: insError } = await supabase
                .from('workflow_assignments')
                .insert([{
                    request_id: request.id,
                    request_type: request.certificate_type,
                    step_id: targetStep.id.toString(),
                    step_name: targetStep.name,
                    assigned_user_id: userId,
                    status: 'pending'
                }]);

            if (insError) {
                console.error(`❌ Failed to create assignment:`, insError);
            }
        }
    }
    console.log('✨ Repair complete.');
}

repairReturnedRequests();
