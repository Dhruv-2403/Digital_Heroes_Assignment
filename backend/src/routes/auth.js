const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash: passwordHash, role: 'subscriber' })
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*, subscriptions(*)')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

router.patch('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ user: sanitizeUser(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me/password', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', req.user.id);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const sanitizeUser = (user) => {
  const { password_hash, ...safe } = user;
  return safe;
};

module.exports = router;
