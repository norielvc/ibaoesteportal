const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_ID = '2a6054aa-d73d-4f52-876f-efa95f77add9'; // Used as fallback recently
const OLD_RELEASING_ID = '379898b5-06e9-43a7-b51d-213aec975825'; // Sarah Wilson (Old)
const BROOK_DONO_ID = '0daafd45-47d3-40a9-bb2b-3a337226b3af'; // Brook Dono (Actual Releasing Officer)

// We want to force updating the Releasing Team step (usually ID 999 or status 'oic_review') to Brook Dono
// regardless of who is currently assigned (unless it's already Brook Dono).

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

        // Map through steps
        const newSteps = steps.map(step => {
            // Check if this is the "Releasing Team" step (by ID 999 or status 'oic_review')
            if (step.id === 999 || step.status === 'oic_review' || step.name.toLowerCase().includes('releasing team')) {
                // If assignedUsers is missing, not an array, or doesn't contain ONLY Brook Dono
                if (!step.assignedUsers || !Array.isArray(step.assignedUsers) || step.assignedUsers.length !== 1 || step.assignedUsers[0] !== BROOK_DONO_ID) {
                    console.log(`Updating step "${step.name}" in config ${config.certificate_type} to assign Brook Dono`);
                    updated = true;
                    return {
                        ...step,
                        assignedUsers: [BROOK_DONO_ID] // Force assign Brook Dono
                    };
                }
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
        } else {
            console.log(`Config ${config.certificate_type} is already correct.`);
        }
    }
}

updateWorkflowConfigs().catch(console.error);
