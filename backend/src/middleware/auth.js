const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

/**
 * Middleware: verifies JWT and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('*, subscriptions(*)')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: checks that the user has an active subscription
 */
const requireSubscription = (req, res, next) => {
  const sub = req.user?.subscriptions?.[0];
  if (!sub || sub.status !== 'active') {
    return res.status(403).json({
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  next();
};

/**
 * Middleware: admin-only access
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireSubscription, requireAdmin };
