const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── List All Charities (public) ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { search, featured } = req.query;

  let query = supabase.from('charities').select('*');

  if (search) query = query.ilike('name', `%${search}%`);
  if (featured === 'true') query = query.eq('featured', true);

  const { data, error } = await query.order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ charities: data });
});

// ─── Get Single Charity ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Charity not found' });
  res.json({ charity: data });
});

// ─── Create Charity (admin) ───────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, featured } = req.body;
    if (!name) return res.status(400).json({ error: 'Charity name is required' });

    const { data, error } = await supabase
      .from('charities')
      .insert({ name, description, image_url, featured: featured || false })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ charity: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Charity (admin) ───────────────────────────────────────────────────
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, featured } = req.body;
    const { data, error } = await supabase
      .from('charities')
      .update({ name, description, image_url, featured })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ charity: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete Charity (admin) ───────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase.from('charities').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Charity deleted' });
});

// ─── User selects a charity ───────────────────────────────────────────────────
router.post('/select', authenticate, async (req, res) => {
  try {
    const { charity_id, charity_percentage } = req.body;
    // Minimum 10%, max 100%
    const pct = Math.min(100, Math.max(10, charity_percentage || 10));

    const { data, error } = await supabase
      .from('users')
      .update({ charity_id, charity_percentage: pct })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
