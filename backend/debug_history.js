const { supabase } = require('./services/supabaseClient');

async function debug() {
  const ref = 'BC-2026-57045';
  console.log(`--- Debugging ${ref} ---`);
  
  const { data: req } = await supabase
    .from('certificate_requests')
    .select('id, status')
    .eq('reference_number', ref)
    .single();
    
  if (!req) { console.log('Request not found'); return; }
  
  const { data: history, error } = await supabase
    .from('workflow_history')
    .select('*')
    .eq('request_id', req.id)
    .order('created_at', { ascending: true });
    
  if (error) { console.log('Error:', error); return; }
  if (!history) { console.log('No history'); return; }
  
  console.log('History Entry Count:', history.length);
  
  history.forEach((h, i) => {
    console.log(`[${i}] Action: ${h.action}, Step: ${h.step_name}, Role: ${h.official_role}, HasSig: !!h.signature_data: ${!!h.signature_data}`);
  });
}

debug();
