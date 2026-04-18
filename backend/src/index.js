require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(morgan('dev'));

app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://digital-heroes-assignment-alpha.vercel.app',
    process.env.ADMIN_URL || 'https://digital-heroes-assignment-ha1l.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true
}));

app.get('/', (req, res) => {
  res.json({ message: 'Digital Heroes API is live', documentation: '/README.md' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/winners', require('./routes/winners'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhooks', require('./routes/webhooks'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Digital Heroes API running on http://localhost:${PORT}`);
});
