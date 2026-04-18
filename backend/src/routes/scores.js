const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, requireSubscription } = require('../middleware/auth');

const MAX_SCORES = 5;
const MIN_SCORE = 1;
const MAX_SCORE = 45;

// ─── Get My Scores ────────────────────────────────────────────────────────────
// GET /api/scores
router.get('/', authenticate, requireSubscription, async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ scores: data });
});

// ─── Add a Score ──────────────────────────────────────────────────────────────
// POST /api/scores
router.post('/', authenticate, requireSubscription, async (req, res) => {
  try {
    const { score, date } = req.body;

    // Validate score range
    if (!score || score < MIN_SCORE || score > MAX_SCORE)
      return res.status(400).json({ error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` });

    if (!date)
      return res.status(400).json({ error: 'Date is required' });

    // Prevent duplicate date entries
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .single();

    if (existing)
      return res.status(409).json({ error: 'A score for this date already exists. Edit or delete it instead.' });

    // Count current scores
    const { data: allScores } = await supabase
      .from('scores')
      .select('id, date')
      .eq('user_id', req.user.id)
      .order('date', { ascending: true });

    // Rolling window: if at max, delete the oldest
    if (allScores && allScores.length >= MAX_SCORES) {
      const oldest = allScores[0];
      await supabase.from('scores').delete().eq('id', oldest.id);
    }

    // Insert new score
    const { data: newScore, error } = await supabase
      .from('scores')
      .insert({ user_id: req.user.id, score: parseInt(score), date })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ score: newScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Edit a Score ─────────────────────────────────────────────────────────────
// PATCH /api/scores/:id
router.patch('/:id', authenticate, requireSubscription, async (req, res) => {
  try {
    const { score, date } = req.body;
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('scores')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Score not found' });

    // If changing date, check for duplicate
    if (date && date !== existing.date) {
      const { data: dup } = await supabase
        .from('scores')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('date', date)
        .neq('id', id)
        .single();

      if (dup) return res.status(409).json({ error: 'A score for this date already exists' });
    }

    // Validate score range
    if (score && (score < MIN_SCORE || score > MAX_SCORE))
      return res.status(400).json({ error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` });

    const updates = {};
    if (score) updates.score = parseInt(score);
    if (date) updates.date = date;

    const { data, error } = await supabase
      .from('scores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ score: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete a Score ───────────────────────────────────────────────────────────
// DELETE /api/scores/:id
router.delete('/:id', authenticate, requireSubscription, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Score not found' });

    await supabase.from('scores').delete().eq('id', req.params.id);
    res.json({ message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
