const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Search residents by name
router.get('/search', async (req, res) => {
    try {
        const { name = '' } = req.query;

        // Search across the generated full_name column
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .ilike('full_name', `%${name}%`)
            .order('last_name', { ascending: true })
            .limit(1000);

        if (error) throw error;

        res.json({ success: true, residents: data });
    } catch (error) {
        console.error('Error searching residents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bulk insert residents (for data import)
router.post('/bulk-insert', async (req, res) => {
    try {
        const { residents } = req.body;

        if (!residents || !Array.isArray(residents)) {
            return res.status(400).json({ success: false, message: 'Invalid residents data' });
        }

        // Insert data into Supabase
        const { data, error } = await supabase
            .from('residents')
            .insert(residents)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: `${data.length} residents imported successfully`,
            count: data.length
        });
    } catch (error) {
        console.error('Error importing residents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new resident
router.post('/', async (req, res) => {
    try {
        const residentData = req.body;
        const { data, error } = await supabase
            .from('residents')
            .insert([residentData])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, resident: data });
    } catch (error) {
        console.error('Error creating resident:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update resident
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { data, error } = await supabase
            .from('residents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, resident: data });
    } catch (error) {
        console.error('Error updating resident:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete resident
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('residents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Resident deleted successfully' });
    } catch (error) {
        console.error('Error deleting resident:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
