import { authenticateToken } from '../../../src/lib/api-auth';
import { supabase } from '../../../lib/supabase';

/**
 * GET /api/pickup/all
 * Fetches all pickup records for the tenant
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: 'Tenant context required' });
  }

  try {
    // Fetch all pickup records (certificates that have been released)
    const { data: pickupRecords, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'released')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching pickup records:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: pickupRecords || [] });
  } catch (error) {
    console.error('Error in pickup/all:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
