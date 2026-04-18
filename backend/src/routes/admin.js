const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: draws },
      { data: charities },
      { data: winners },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('draws').select('id, status, prize_pools(total_pool, jackpot_pool)').order('created_at', { ascending: false }).limit(6),
      supabase.from('charities').select('id, name'),
      supabase.from('winners').select('prize_amount, status'),
    ]);

    const totalPrizePaid = winners
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + w.prize_amount, 0);

    const totalPrizePending = winners
      .filter(w => w.status === 'pending' || w.status === 'approved')
      .reduce((sum, w) => sum + w.prize_amount, 0);

    res.json({
      totalUsers,
      activeSubscribers,
      totalCharities: charities?.length || 0,
      totalDraws: draws?.length || 0,
      totalPrizePaid,
      totalPrizePending,
      recentDraws: draws,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, charity_id, charity_percentage, created_at, subscriptions(*)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, subscriptions(*), scores(*), winners(*)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json({ user: data });
});

router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ name, email, role })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:userId/scores/:scoreId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { score, date } = req.body;
    const { data, error } = await supabase
      .from('scores')
      .update({ score, date })
      .eq('id', req.params.scoreId)
      .eq('user_id', req.params.userId)
      .select()
      .single();
    if (error) throw error;
    res.json({ score: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/subscriptions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ subscription: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/charity', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('charity_id, charity_percentage, charities(name), subscriptions(plan, status)')
    .not('charity_id', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const MONTHLY_FEE = 10; // Example: £10/month
  const YEARLY_FEE  = 100;

  const totals = {};
  for (const user of data) {
    const sub = user.subscriptions?.[0];
    if (!sub || sub.status !== 'active') continue;
    const fee = sub.plan === 'yearly' ? YEARLY_FEE / 12 : MONTHLY_FEE;
    const contribution = (fee * (user.charity_percentage || 10)) / 100;
    const cid = user.charity_id;
    if (!totals[cid]) totals[cid] = { name: user.charities?.name, total: 0 };
    totals[cid].total += contribution;
  }

  res.json({ charityTotals: Object.values(totals) });
});

module.exports = router;
