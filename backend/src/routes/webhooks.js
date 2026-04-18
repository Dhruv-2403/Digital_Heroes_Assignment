const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../lib/supabase');

// POST /api/webhooks/stripe
// Express.raw() is applied to this route in index.js
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // ── New subscription created (checkout completed) ─────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;

        // Get the full Stripe subscription to extract period end
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan,
          status: 'active',
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          renewal_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        break;
      }

      // ── Subscription renewed ──────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              renewal_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);
        break;
      }

      // ── Subscription cancelled or expired ─────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── Subscription updated (plan change, cancel_at_period_end, etc.) ───
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            renewal_date: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
