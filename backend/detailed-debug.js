const { supabase } = require('./services/supabaseClient');

async function debug() {
  const ref = 'CI-2026-91256';
  console.log(`--- Debugging ${ref} ---`);
  
  const { data: req } = await supabase
    .from('certificate_requests')
    .select('id, status')
    .eq('reference_number', ref)
    .single();
    
  if (!req) { console.log('Request not found'); return; }
  
  const { data: history } = await supabase
    .from('workflow_history')
    .select('*, users:performed_by(first_name, last_name, role, employee_code)')
    .eq('request_id', req.id)
    .order('created_at', { ascending: true });
    
  console.log('History Entry Count:', history.length);
  
  history.forEach((h, i) => {
    console.log(`[${i}] Action: ${h.action}, Role: ${h.official_role || h.step_name}, PerformedBy: ${h.users ? h.users.first_name + ' ' + h.users.last_name : 'UNKNOWN'}, Code: ${h.users?.employee_code || 'NONE'}, HasSig: ${h.signature_data ? 'YES' : 'NO'}`);
  });
}

debug();
