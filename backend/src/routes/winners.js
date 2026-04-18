const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');

// Use memory storage — we'll upload to Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Get My Winnings ──────────────────────────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('winners')
    .select('*, draws(month, draw_numbers)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ winners: data });
});

// ─── Upload Proof (winner only) ───────────────────────────────────────────────
router.post('/:id/proof', authenticate, upload.single('proof'), async (req, res) => {
  try {
    // Verify this winner record belongs to user
    const { data: winner } = await supabase
      .from('winners')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!winner) return res.status(404).json({ error: 'Winner record not found' });
    if (!req.file) return res.status(400).json({ error: 'Proof file is required' });

    // Upload to Supabase Storage
    const filename = `proofs/${req.user.id}/${req.params.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(filename);

    const { data, error } = await supabase
      .from('winners')
      .update({ proof_url: publicUrl, proof_submitted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ winner: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: List All Winners ──────────────────────────────────────────────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('winners')
    .select('*, users(name, email), draws(month)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ winners: data });
});

// ─── Admin: Approve or Reject Winner ─────────────────────────────────────────
router.patch('/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ error: 'action must be approve or reject' });

    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase
      .from('winners')
      .update({ verification_status: status, verified_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ winner: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Mark as Paid ──────────────────────────────────────────────────────
router.patch('/:id/pay', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ winner: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
