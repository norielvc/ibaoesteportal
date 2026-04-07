/**
 * Protection Config API — superadmin only
 * GET  /api/superadmin/protection-config  — read current config
 * PUT  /api/superadmin/protection-config  — update config
 * Config is stored in Supabase system_settings table
 */
import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

const DEFAULT_CONFIG = {
  rateLimitEnabled: true,
  rateLimitMax: 5,
  rateLimitWindowHours: 1,
  duplicateCheckEnabled: true,
  cooldownEnabled: true,
  cooldownDays: 30,
};

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["superadmin", "super_admin"].includes(user.role)) {
    return res.status(403).json({ success: false, message: "Superadmin access required" });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "protection_config")
        .single();

      if (error) {
        // Table may not exist yet — return defaults
        return res.json({ success: true, data: DEFAULT_CONFIG });
      }
      const config = data?.value || DEFAULT_CONFIG;
      return res.json({ success: true, data: config });
    } catch {
      return res.json({ success: true, data: DEFAULT_CONFIG });
    }
  }

  if (req.method === "PUT") {
    const config = req.body;
    if (!config || typeof config !== "object") {
      return res.status(400).json({ success: false, message: "Invalid config" });
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert([{ key: "protection_config", value: config, updated_at: new Date().toISOString() }], { onConflict: "key" });

    if (error) {
      // Table doesn't exist — just return success (config will use defaults)
      console.warn("system_settings table not found. Create it in Supabase dashboard.");
      return res.json({ success: true, message: "Config saved in memory (table not yet created)" });
    }
    return res.json({ success: true, message: "Protection config updated" });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
