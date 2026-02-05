const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Search residents by name with pagination
router.get('/search', async (req, res) => {
    try {
        const { name = '', page = 1, limit = 15 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Search across the generated full_name column
        let query = supabase
            .from('residents')
            .select('*', { count: 'exact' })
            .ilike('full_name', `%${name}%`)
            .order('last_name', { ascending: true })
            .range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            residents: data,
            totalItems: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum
        });
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
        const residentData = { ...req.body };

        // Remove generated or system columns
        delete residentData.full_name;
        delete residentData.id;

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
        const updates = { ...req.body };

        // Remove read-only or generated columns to prevent Supabase errors
        delete updates.full_name;
        delete updates.id;
        delete updates.created_at;
        delete updates.updated_at;

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
