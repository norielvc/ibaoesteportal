-- Check schema of workflow_configurations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflow_configurations';

-- Check existing rows
SELECT * FROM workflow_configurations;
