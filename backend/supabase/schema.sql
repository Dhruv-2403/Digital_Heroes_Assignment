-- ============================================================
-- Digital Heroes Golf Platform — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (new project)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  charity_id          UUID,
  charity_percentage  INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                  TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id  TEXT UNIQUE,
  stripe_customer_id      TEXT,
  renewal_date            TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHARITIES ────────────────────────────────────────────────────────────────
CREATE TABLE charities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  featured     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from users to charities (after charities table exists)
ALTER TABLE users ADD CONSTRAINT fk_users_charity FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE SET NULL;

-- ─── SCORES ───────────────────────────────────────────────────────────────────
CREATE TABLE scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  -- Only one score per user per date
  UNIQUE (user_id, date)
);

-- ─── DRAWS ────────────────────────────────────────────────────────────────────
CREATE TABLE draws (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month           TEXT NOT NULL UNIQUE,          -- e.g. '2024-01'
  draw_type       TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  draw_numbers    INTEGER[],                      -- the 5 winning numbers
  status          TEXT NOT NULL DEFAULT 'draft'  CHECK (status IN ('draft', 'simulated', 'published')),
  jackpot_rolled  BOOLEAN DEFAULT FALSE,
  simulated_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRIZE POOLS ──────────────────────────────────────────────────────────────
CREATE TABLE prize_pools (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id           UUID UNIQUE NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  total_pool        NUMERIC(10,2) DEFAULT 0,
  jackpot_pool      NUMERIC(10,2) DEFAULT 0,     -- 40% (+ any rollover)
  four_match_pool   NUMERIC(10,2) DEFAULT 0,     -- 35%
  three_match_pool  NUMERIC(10,2) DEFAULT 0,     -- 25%
  rolled_jackpot    NUMERIC(10,2) DEFAULT 0,     -- amount rolled from previous month
  jackpot_rolled    BOOLEAN DEFAULT FALSE,        -- true if jackpot not won (rolls to next month)
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WINNERS ──────────────────────────────────────────────────────────────────
CREATE TABLE winners (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id              UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type           TEXT NOT NULL CHECK (match_type IN ('3-match', '4-match', '5-match')),
  prize_amount         NUMERIC(10,2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  verification_status  TEXT CHECK (verification_status IN ('approved', 'rejected')),
  proof_url            TEXT,
  proof_submitted_at   TIMESTAMPTZ,
  verified_at          TIMESTAMPTZ,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_date ON scores(date);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_draws_status ON draws(status);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED: Admin User ─────────────────────────────────────────────────────────
-- Password: Admin@123 (bcrypt hash — change this in production!)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Admin',
  'admin@digitalheroes.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5oDYcnORpK',
  'admin'
);

-- ─── SEED: Sample Charities ───────────────────────────────────────────────────
INSERT INTO charities (name, description, featured) VALUES
  ('Cancer Research UK',      'Funding world-class research to beat cancer.',                               TRUE),
  ('British Heart Foundation','Fighting heart and circulatory disease through research and campaigning.',   TRUE),
  ('Mind',                    'Providing advice and support for mental health conditions.',                  FALSE),
  ('Shelter',                 'Fighting for people in bad or unaffordable housing.',                        FALSE),
  ('WWF',                     'Working to conserve nature and reduce the most pressing threats to diversity.',FALSE);
