-- =============================================================================
-- Affuaa — Complete Database Schema
-- Generated from all Drizzle ORM schema files
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- AUTH
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  sid        VARCHAR PRIMARY KEY,
  sess       JSONB NOT NULL,
  expire     TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS users (
  id                              VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email                           VARCHAR UNIQUE,
  password_hash                   VARCHAR,
  first_name                      VARCHAR,
  last_name                       VARCHAR,
  profile_image_url               VARCHAR,
  bio                             TEXT,
  location                        TEXT,
  website                         TEXT,
  instagram                       TEXT,
  twitter                         TEXT,
  equipment                       TEXT[] DEFAULT '{}',
  style_tags                      TEXT[] DEFAULT '{}',
  availability                    TEXT DEFAULT 'available',
  hiring_url                      TEXT,
  accent_color                    TEXT,
  featured_photo_id               INTEGER,
  profile_views                   INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id              TEXT,
  stripe_subscription_id          TEXT,
  subscription_status             TEXT NOT NULL DEFAULT 'free',
  subscription_current_period_end TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- PHOTOGRAPHER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS photographer_profiles (
  user_id                   VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_qualified_for_premium  BOOLEAN NOT NULL DEFAULT FALSE,
  premium_earnings_total    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  premium_earnings_paid     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SERIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS series (
  id                VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  photographer_name TEXT NOT NULL,
  cover_image_url   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- PHOTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS photos (
  id                    SERIAL PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT,
  image_url             TEXT NOT NULL,
  blur_hash             TEXT,
  width                 INTEGER NOT NULL DEFAULT 1920,
  height                INTEGER NOT NULL DEFAULT 1280,
  photographer_name     TEXT NOT NULL,
  photographer_avatar_url TEXT,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  likes                 INTEGER NOT NULL DEFAULT 0,
  downloads             INTEGER NOT NULL DEFAULT 0,
  views                 INTEGER NOT NULL DEFAULT 0,
  is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
  is_homepage_hero      BOOLEAN NOT NULL DEFAULT FALSE,
  is_potd_pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  pin_until_hero        TIMESTAMPTZ,
  pin_until_potd        TIMESTAMPTZ,
  is_premium_only       BOOLEAN NOT NULL DEFAULT FALSE,
  content_warning       BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by           VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  publish_at            TIMESTAMPTZ,
  series_id             INTEGER,
  series_position       INTEGER,
  camera                TEXT,
  lens                  TEXT,
  aperture              TEXT,
  shutter_speed         TEXT,
  iso                   INTEGER,
  focal_length          TEXT,
  license               TEXT NOT NULL DEFAULT 'cc0',
  status                TEXT NOT NULL DEFAULT 'published'
);


-- =============================================================================
-- COLLECTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS collections (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  is_private      BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id        VARCHAR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_photos (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  photo_id      INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, photo_id)
);


-- =============================================================================
-- COMMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  photo_id    INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  author_id   VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- REACTIONS (emoji reactions on photos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS reactions (
  photo_id   INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  actor_id   TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (photo_id, actor_id, emoji)
);


-- =============================================================================
-- FOLLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS follows (
  follower_name  TEXT NOT NULL,
  following_name TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_name, following_name)
);

CREATE TABLE IF NOT EXISTS follow_alerts (
  id             SERIAL PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  actor_name     TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'follow',
  series_id      INTEGER,
  series_name    TEXT,
  photo_id       INTEGER,
  photo_title    TEXT,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- MESSAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id             SERIAL PRIMARY KEY,
  sender_name    TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  content        TEXT NOT NULL DEFAULT '',
  read           BOOLEAN NOT NULL DEFAULT FALSE,
  photo_id       INTEGER REFERENCES photos(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id   INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reactor_name TEXT NOT NULL,
  emoji        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, reactor_name, emoji)
);


-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  recipient_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  photo_id     INTEGER REFERENCES photos(id) ON DELETE CASCADE,
  photo_title  TEXT NOT NULL DEFAULT '',
  actor_name   TEXT NOT NULL DEFAULT 'Someone',
  comment_body TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- DOWNLOAD PACKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS download_packs (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT,
  price               NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
  created_by_name     TEXT NOT NULL,
  created_by_user_id  VARCHAR,
  photo_ids           INTEGER[] NOT NULL DEFAULT '{}',
  cover_image_url     TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  total_downloads     INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pack_purchases (
  id                        SERIAL PRIMARY KEY,
  pack_id                   INTEGER NOT NULL,
  buyer_user_id             VARCHAR NOT NULL,
  stripe_payment_intent_id  TEXT,
  amount                    NUMERIC(10, 2) NOT NULL,
  purchased_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- CHALLENGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  theme       TEXT NOT NULL,
  prize       TEXT,
  rules       TEXT,
  deadline    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_entries (
  id                   SERIAL NOT NULL,
  challenge_id         INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  photo_id             INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  submitter_name       TEXT NOT NULL,
  submitted_by_user_id VARCHAR,
  photo_title          TEXT,
  photo_image_url      TEXT,
  votes                INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (challenge_id, photo_id)
);


-- =============================================================================
-- REFERRALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id                 SERIAL PRIMARY KEY,
  referrer_user_id   VARCHAR NOT NULL,
  referrer_name      TEXT,
  code               VARCHAR(16) NOT NULL UNIQUE,
  referred_user_id   VARCHAR,
  referred_name      TEXT,
  commission_earned  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at       TIMESTAMPTZ
);


-- =============================================================================
-- PAYOUTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS payouts (
  id                    SERIAL PRIMARY KEY,
  payout_id             VARCHAR(32) NOT NULL UNIQUE,
  user_id               VARCHAR,
  photographer_name     TEXT NOT NULL,
  email                 TEXT,
  type                  TEXT NOT NULL DEFAULT 'commission',
  description           TEXT NOT NULL,
  amount                NUMERIC(10, 2) NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  payment_method        TEXT NOT NULL DEFAULT 'paypal',
  paypal_email          TEXT,
  bank_name             TEXT,
  bank_account_holder   TEXT,
  bank_account_last4    TEXT,
  bank_routing_last4    TEXT,
  notes                 TEXT,
  admin_notes           TEXT,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at          TIMESTAMPTZ
);


-- =============================================================================
-- REPORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id            SERIAL PRIMARY KEY,
  photo_id      INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  reporter_name TEXT NOT NULL,
  reason        TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- VERIFICATION REQUESTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id                SERIAL PRIMARY KEY,
  user_id           VARCHAR(255) NOT NULL,
  photographer_name TEXT NOT NULL,
  email             TEXT,
  portfolio_url     TEXT,
  instagram_url     TEXT,
  website           TEXT,
  bio               TEXT,
  photo_count       INTEGER DEFAULT 0,
  follower_count    INTEGER DEFAULT 0,
  reason            TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  admin_notes       TEXT,
  reviewed_by       TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ
);


-- =============================================================================
-- SUPPORT CHAT
-- =============================================================================

CREATE TABLE IF NOT EXISTS support_chat (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(64) NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'customer',
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECURITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id          SERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info',
  ip_address  TEXT,
  user_id     TEXT,
  user_agent  TEXT,
  path        TEXT,
  method      TEXT,
  status_code INTEGER,
  message     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id          SERIAL PRIMARY KEY,
  ip_address  TEXT NOT NULL UNIQUE,
  reason      TEXT NOT NULL,
  blocked_by  TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- LOCKS (content moderation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS locks (
  id           SERIAL PRIMARY KEY,
  lock_type    TEXT NOT NULL,
  target_id    TEXT NOT NULL,
  target_label TEXT NOT NULL,
  reason       TEXT,
  locked_by    TEXT NOT NULL,
  locked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlocked_at  TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);


-- =============================================================================
-- SITE SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
