const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Helper to map DB officials to Frontend object
const mapOfficialsToConfig = (officials) => {
  const config = {
    councilors: Array(7).fill(''),
    // Defaults
    chairman: '', secretary: '', treasurer: '', skChairman: '',
    administrator: '', assistantSecretary: '', assistantAdministrator: '',
    recordKeeper: '', clerk: ''
  };

  officials.forEach(o => {
    if (o.position_type === 'captain') config.chairman = o.name;
    else if (o.position_type === 'secretary') config.secretary = o.name;
    else if (o.position_type === 'treasurer') config.treasurer = o.name;
    else if (o.position_type === 'sk_chairman') config.skChairman = o.name;
    else if (o.position_type === 'kagawad') {
      // Parse "Kagawad 1", "Kagawad 2" etc. to determine index
      const match = o.position.match(/Kagawad\s+(\d+)/i);
      if (match) {
        const idx = parseInt(match[1], 10) - 1; // "Kagawad 1" -> 0
        if (idx >= 0 && idx < 7) config.councilors[idx] = o.name;
      } else {
        // Fallback: Use order_index if position name doesn't match
        // Kagawads usually start at order_index 5 in our seed data
        const idx = (o.order_index || 5) - 5;
        if (idx >= 0 && idx < 7) config.councilors[idx] = o.name;
      }
    }
    // Staff mappings
    else if (o.position === 'Administrator') config.administrator = o.name; // Map by specific position name for staff if type is generic 'staff'
    else if (o.position === 'Assistant Secretary') config.assistantSecretary = o.name;
    else if (o.position === 'Assistant Administrator') config.assistantAdministrator = o.name;
    else if (o.position === 'Barangay Keeper' || o.position === 'Record Keeper') config.recordKeeper = o.name;
    else if (o.position === 'Clerk') config.clerk = o.name;
  });
  return config;
};

// GET Configuration (Officials + Settings)
router.get('/config', async (req, res) => {
  try {
    // 1. Fetch Officials
    const { data: officials, error: officialsError } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (officialsError) throw officialsError;

    // 2. Fetch Settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('barangay_settings')
      .select('value')
      .eq('key', 'certificate_settings')
      .single();

    // Ignore settings error (might not exist yet), use defaults if so
    const settings = settingsRow?.value || {};

    // 3. Merge
    const officialsConfig = mapOfficialsToConfig(officials || []);

    const fullConfig = {
      ...officialsConfig,
      ...settings
    };

    res.json({ success: true, data: fullConfig });

  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Configuration (Update Officials + Settings)
router.put('/config', async (req, res) => {
  try {
    const config = req.body;

    // 1. Update Officials
    // We need to map back from Config -> DB update calls

    const updates = [];

    // Helper to push update promise
    const updateOfficial = (type, name, positionPattern = null, orderIndex = null) => {
      let query = supabase.from('barangay_officials').update({ name, updated_at: new Date() }).eq('position_type', type);

      if (positionPattern) {
        query = query.eq('position', positionPattern); // Approximate match for staff
      }
      if (orderIndex !== null) {
        query = query.eq('order_index', orderIndex);
      }
      return query;
    };

    updates.push(updateOfficial('captain', config.chairman));
    updates.push(updateOfficial('secretary', config.secretary));
    updates.push(updateOfficial('treasurer', config.treasurer));
    updates.push(updateOfficial('sk_chairman', config.skChairman));

    // Councilors
    if (Array.isArray(config.councilors)) {
      config.councilors.forEach((name, i) => {
        // Assuming Kagawads are order_index 1-7 in DB relative to Kagawads? 
        // Or they have absolute order_index.
        // Let's safely update by finding the kagawad with specific order_index if we adhere to CREATE_OFFICIALS_TABLE.sql
        // In CREATE_OFFICIALS_TABLE: Kagawad 1 is order_index 5, Kagawad 2 is 6... Kagawad 7 is 11.
        // This is fragile. Better to look up by 'Kagawad ${i+1}' position name or create if not exists?
        // For now, let's try updating by position name 'Kagawad ${i+1}' which matches the seed data.

        updates.push(
          supabase.from('barangay_officials')
            .update({ name, updated_at: new Date() })
            .eq('position_type', 'kagawad')
            .eq('position', `Kagawad ${i + 1}`)
        );
      });
    }

    // Staff
    // In seed: 'Administrator', 'Assistant Secretary', 'Assistant Administrator', 'Barangay Keeper', 'Clerk'
    // position_type is 'staff' for all
    updates.push(supabase.from('barangay_officials').update({ name: config.administrator }).eq('position', 'Administrator'));
    updates.push(supabase.from('barangay_officials').update({ name: config.assistantSecretary }).eq('position', 'Assistant Secretary'));
    updates.push(supabase.from('barangay_officials').update({ name: config.assistantAdministrator }).eq('position', 'Assistant Administrator'));
    updates.push(supabase.from('barangay_officials').update({ name: config.recordKeeper }).eq('position', 'Barangay Keeper')); // Note map
    updates.push(supabase.from('barangay_officials').update({ name: config.clerk }).eq('position', 'Clerk'));


    await Promise.all(updates);

    // 2. Update Settings
    const settingsValue = {
      contactInfo: config.contactInfo,
      headerInfo: config.headerInfo,
      logos: config.logos,
      headerStyle: config.headerStyle,
      sidebarStyle: config.sidebarStyle,
      bodyStyle: config.bodyStyle,
      footerStyle: config.footerStyle,
      countryStyle: config.countryStyle,
      provinceStyle: config.provinceStyle,
      municipalityStyle: config.municipalityStyle,
      barangayNameStyle: config.barangayNameStyle,
      officeNameStyle: config.officeNameStyle
    };

    const { error: settingsError } = await supabase
      .from('barangay_settings')
      .upsert({
        key: 'certificate_settings',
        value: settingsValue,
        updated_at: new Date()
      });

    if (settingsError) throw settingsError;

    res.json({ success: true, message: 'Configuration saved successfully' });

  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all barangay officials (Original Endpoint)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching barangay officials...');

    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials',
        error: error.message
      });
    }

    console.log(`Found ${officials?.length || 0} officials`);

    // Custom ordering: Brgy Captain → Kagawad → SK Chairman → Staff (Secretary & Treasurer)
    const positionOrder = {
      'captain': 1,
      'kagawad': 2,
      'sk_chairman': 3,
      'secretary': 4, // Group with staff
      'treasurer': 4, // Group with staff  
      'staff': 4
    };

    const sortedOfficials = officials?.sort((a, b) => {
      const orderA = positionOrder[a.position_type] || 999;
      const orderB = positionOrder[b.position_type] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Within same position type, sort by order_index for kagawads, or by name for others
      if (a.position_type === 'kagawad' && b.position_type === 'kagawad') {
        return (a.order_index || 0) - (b.order_index || 0);
      }

      // For staff positions, sort by order_index
      return (a.order_index || 0) - (b.order_index || 0);
    }) || [];

    res.json({
      success: true,
      data: sortedOfficials,
      count: sortedOfficials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get officials by position type
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`Fetching officials by type: ${type}`);

    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('position_type', type)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials by type',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: officials || [],
      count: officials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single official by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching official with ID: ${id}`);

    const { data: official, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Official not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: official
    });

  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;