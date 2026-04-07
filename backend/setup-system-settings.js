const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://efwwtftwxhgrvukvjedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3d0ZnR3eGhncnZ1a3ZqZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzQ0MywiZXhwIjoyMDgyNjUzNDQzfQ.xkldtB6fABnOCn-vr87d4sKYzjvPqgHGjUuYiraV_50'
);

async function setup() {
  // Insert default protection config (all disabled = dev mode)
  const { error } = await supabase
    .from('system_settings')
    .upsert([{
      key: 'protection_config',
      value: {
        rateLimitEnabled: false,
        rateLimitMax: 5,
        rateLimitWindowHours: 1,
        duplicateCheckEnabled: false,
        cooldownEnabled: false,
        cooldownDays: 30
      },
      updated_at: new Date().toISOString()
    }], { onConflict: 'key' });

  if (error) {
    console.log('Error (table may not exist yet):', error.message);
    console.log('\nPlease run this SQL in your Supabase dashboard SQL editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value) VALUES (
  'protection_config',
  '{"rateLimitEnabled":false,"rateLimitMax":5,"rateLimitWindowHours":1,"duplicateCheckEnabled":false,"cooldownEnabled":false,"cooldownDays":30}'
) ON CONFLICT (key) DO NOTHING;
    `);
  } else {
    console.log('Default protection config saved (all disabled for dev mode)');
  }
}

setup().catch(console.error);
