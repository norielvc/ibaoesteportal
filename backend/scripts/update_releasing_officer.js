const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

console.log('Supabase URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : 'MISSING');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OLD_RELEASING_ID = '379898b5-06e9-43a7-b51d-213aec975825'; // Sarah Wilson (Old)
const NEW_RELEASING_ID = '2a6054aa-d73d-4f52-876f-efa95f77add9'; // Admin User (New Fallback)
// You can also use specific user if known. Admin is a safe bet for fallback testing.

async function updateWorkflowConfigs() {
    console.log('Fetching workflow configurations...');
    const { data: configs, error } = await supabase.from('workflow_configurations').select('*');

    if (error) {
        console.error('Error fetching configs:', error);
        return;
    }

    console.log(`Found ${configs.length} configurations.`);

    for (const config of configs) {
        let updated = false;
        let steps = config.workflow_config.steps;

        // Iterate through steps and assignedUsers
        const newSteps = steps.map(step => {
            if (step.assignedUsers && Array.isArray(step.assignedUsers) && step.assignedUsers.includes(OLD_RELEASING_ID)) {
                console.log(`Updating step "${step.name}" in config ${config.certificate_type} (Step ID: ${step.id})`);
                updated = true;
                // Replace old ID with new ID
                const newUsers = step.assignedUsers.map(uid => uid === OLD_RELEASING_ID ? NEW_RELEASING_ID : uid);
                return { ...step, assignedUsers: newUsers };
            }
            return step;
        });

        if (updated) {
            const { error: updateError } = await supabase
                .from('workflow_configurations')
                .update({
                    workflow_config: { ...config.workflow_config, steps: newSteps },
                    updated_at: new Date().toISOString()
                })
                .eq('id', config.id);

            if (updateError) {
                console.error(`Failed to update ${config.certificate_type}:`, updateError);
            } else {
                console.log(`Successfully updated ${config.certificate_type} workflow configuration.`);
            }
        }
    }
}

updateWorkflowConfigs().catch(console.error);
