import { authenticateToken } from '../../../../src/lib/api-auth';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers['x-tenant-id'];
  if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
  const { id } = req.query;
  const { action, comments, next_step, next_step_name, next_assigned_users } = req.body;

  // Update the current assignment
  const { data: assignment, error } = await supabase.from('workflow_assignments')
    .update({ status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action, updated_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId).select().single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  // Log to history
  await supabase.from('workflow_history').insert([{
    tenant_id: tenantId, request_id: assignment.request_id,
    request_type: assignment.request_type, step_id: assignment.step_id,
    step_name: assignment.step_name, action,
    performed_by: user._id, comments: comments || '', new_status: action
  }]);

  // Create next step assignments if provided
  if (next_step && next_assigned_users?.length) {
    for (const userId of next_assigned_users) {
      await supabase.from('workflow_assignments').insert([{
        request_id: assignment.request_id, tenant_id: tenantId,
        request_type: assignment.request_type, step_id: next_step.toString(),
        step_name: next_step_name || 'Next Step', assigned_user_id: userId, status: 'pending'
      }]);
    }
  }

  return res.json({ success: true, data: assignment });
}
