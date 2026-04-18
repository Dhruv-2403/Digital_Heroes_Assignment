const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// ─── Create Checkout Session ──────────────────────────────────────────────────
// POST /api/subscriptions/checkout
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' | 'yearly'

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: req.user.id, plan },
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Subscription Status ──────────────────────────────────────────────────
// GET /api/subscriptions/my
router.get('/my', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(404).json({ error: 'No subscription found' });
  res.json({ subscription: data });
});

// ─── Cancel Subscription ──────────────────────────────────────────────────────
// POST /api/subscriptions/cancel
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (!sub) return res.status(404).json({ error: 'No active subscription' });

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('stripe_subscription_id', sub.stripe_subscription_id);

    res.json({ message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Billing Portal Session ───────────────────────────────────────────
// POST /api/subscriptions/portal
router.post('/portal', authenticate, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (!sub) return res.status(404).json({ error: 'No subscription found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
