import { authenticateToken } from '../../../../src/lib/api-auth';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers['x-tenant-id'];
  if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });

  const { id } = req.query;
  const { status, comments, current_step } = req.body;

  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  const updateData = { status, updated_at: new Date().toISOString() };
  if (current_step) updateData.current_step = current_step;

  const { data, error } = await supabase.from('certificate_requests')
    .update(updateData).eq('id', id).eq('tenant_id', tenantId).select().single();
  if (error) return res.status(400).json({ success: false, message: error.message });

  // Log to workflow history
  await supabase.from('workflow_history').insert([{
    tenant_id: tenantId, request_id: id, request_type: data.certificate_type,
    step_name: current_step || status, action: status,
    performed_by: user._id, comments: comments || '', new_status: status
  }]);

  return res.json({ success: true, data });
}
