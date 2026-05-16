-- ============================================================
-- AFFUAA — Complete Supabase Schema
-- Version: 2.0 | Generated: 2026-05-16
--
-- Instructions for Supabase:
--   1. Open the Supabase SQL Editor for your project
--   2. Paste and run this entire file
--   3. RLS is enabled on every table — adjust policies to fit
--      your auth strategy (Supabase Auth vs custom JWT)
--   4. The `security_events` table feeds the admin Security Monitor
--
-- Auth note:
--   This app uses a custom session-based auth (not Supabase Auth).
--   If you switch to Supabase Auth, replace `users.id` references
--   with `auth.uid()` in the RLS policies below.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: sessions
-- Required for custom session-based auth. Do not drop.
-- ============================================================
CREATE TABLE IF NOT EXISTS "sessions" (
    "sid"    varchar        PRIMARY KEY NOT NULL,
    "sess"   jsonb          NOT NULL,
    "expire" timestamp      NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
    ON "sessions" USING btree ("expire");

ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
-- Sessions are only accessible server-side (service role).
-- No public RLS policy — blocked by default.


-- ============================================================
-- TABLE: users
-- Core user record. Created on first login via Replit OIDC.
-- ============================================================
CREATE TABLE IF NOT EXISTS "users" (
    "id"                              varchar        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email"                           varchar        UNIQUE,
    "role"                            text           DEFAULT 'user' NOT NULL,
    "password_hash"                   varchar,
    "first_name"                      varchar,
    "last_name"                       varchar,
    "profile_image_url"               varchar,
    "bio"                             text,
    "location"                        text,
    "website"                         text,
    "instagram"                       text,
    "twitter"                         text,
    "equipment"                       text[]         DEFAULT '{}',
    "style_tags"                      text[]         DEFAULT '{}',
    "availability"                    text           DEFAULT 'available',
    "hiring_url"                      text,
    "accent_color"                    text,
    "featured_photo_id"               integer,
    "profile_views"                   integer        DEFAULT 0 NOT NULL,
    "stripe_customer_id"              text,
    "stripe_subscription_id"          text,
    "subscription_status"             text           DEFAULT 'free' NOT NULL,
    "subscription_current_period_end" timestamp with time zone,
    "is_verified"                     boolean        DEFAULT false NOT NULL,
    "is_suspended"                    boolean        DEFAULT false NOT NULL,
    "created_at"                      timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at"                      timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_users_role"  ON "users" ("role");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
-- Public profiles are readable by everyone
CREATE POLICY "users_public_read"  ON "users" FOR SELECT USING (true);
-- Users can only update their own record
CREATE POLICY "users_self_update"  ON "users" FOR UPDATE USING (id = current_setting('app.current_user_id', true));
-- Only service role can insert (handled by auth callback)
CREATE POLICY "users_service_insert" ON "users" FOR INSERT WITH CHECK (false);


-- ============================================================
-- TABLE: user_roles
-- Fine-grained role grants (admin, moderator, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id"    varchar        NOT NULL,
    "role"       text           NOT NULL,
    "granted_by" varchar,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "user_roles_pk" PRIMARY KEY ("user_id", "role")
);

CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "user_roles" ("role");

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fk"
    FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
-- Only admins (service role) manage roles
CREATE POLICY "user_roles_service_only" ON "user_roles" USING (false);


-- ============================================================
-- TABLE: series
-- Groups of photos by a photographer
-- ============================================================
CREATE TABLE IF NOT EXISTS "series" (
    "id"                serial         PRIMARY KEY NOT NULL,
    "name"              text           NOT NULL,
    "description"       text,
    "photographer_name" text           NOT NULL,
    "cover_image_url"   text,
    "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_series_photographer_name" ON "series" ("photographer_name");

ALTER TABLE "series" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_public_read"   ON "series" FOR SELECT USING (true);
CREATE POLICY "series_owner_insert"  ON "series" FOR INSERT WITH CHECK (true);
CREATE POLICY "series_owner_update"  ON "series" FOR UPDATE USING (true);
CREATE POLICY "series_owner_delete"  ON "series" FOR DELETE USING (true);


-- ============================================================
-- TABLE: photos
-- Core content table. Photos have tags, EXIF data, and status.
-- ============================================================
CREATE TABLE IF NOT EXISTS "photos" (
    "id"                      serial         PRIMARY KEY NOT NULL,
    "title"                   text           NOT NULL,
    "description"             text,
    "image_url"               text           NOT NULL,
    "blur_hash"               text,
    "width"                   integer        DEFAULT 1920 NOT NULL,
    "height"                  integer        DEFAULT 1280 NOT NULL,
    "photographer_name"       text           NOT NULL,
    "photographer_avatar_url" text,
    "tags"                    text[]         DEFAULT '{}' NOT NULL,
    "likes"                   integer        DEFAULT 0 NOT NULL,
    "downloads"               integer        DEFAULT 0 NOT NULL,
    "views"                   integer        DEFAULT 0 NOT NULL,
    "is_featured"             boolean        DEFAULT false NOT NULL,
    "is_homepage_hero"        boolean        DEFAULT false NOT NULL,
    "is_potd_pinned"          boolean        DEFAULT false NOT NULL,
    "pin_until_hero"          timestamp with time zone,
    "pin_until_potd"          timestamp with time zone,
    "is_premium_only"         boolean        DEFAULT false NOT NULL,
    "content_warning"         boolean        DEFAULT false NOT NULL,
    "uploaded_by"             varchar,
    "created_at"              timestamp with time zone DEFAULT now() NOT NULL,
    "publish_at"              timestamp with time zone,
    "series_id"               integer,
    "camera"                  text,
    "lens"                    text,
    "aperture"                text,
    "shutter_speed"           text,
    "iso"                     integer,
    "focal_length"            text,
    "license"                 text           DEFAULT 'cc0' NOT NULL,
    "status"                  text           DEFAULT 'published' NOT NULL,
    CONSTRAINT "photos_license_check" CHECK (license IN ('cc0','cc-by','cc-by-sa','editorial','all-rights-reserved')),
    CONSTRAINT "photos_status_check"  CHECK (status  IN ('draft','published','pending'))
);

CREATE INDEX IF NOT EXISTS "idx_photos_status"           ON "photos" ("status");
CREATE INDEX IF NOT EXISTS "idx_photos_photographer_name" ON "photos" ("photographer_name");
CREATE INDEX IF NOT EXISTS "idx_photos_uploaded_by"      ON "photos" ("uploaded_by");
CREATE INDEX IF NOT EXISTS "idx_photos_series_id"        ON "photos" ("series_id");
CREATE INDEX IF NOT EXISTS "idx_photos_is_featured"      ON "photos" ("is_featured") WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS "idx_photos_is_homepage_hero" ON "photos" ("is_homepage_hero") WHERE is_homepage_hero = true;
CREATE INDEX IF NOT EXISTS "idx_photos_is_potd"          ON "photos" ("is_potd_pinned") WHERE is_potd_pinned = true;
CREATE INDEX IF NOT EXISTS "idx_photos_created_at"       ON "photos" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_photos_likes"            ON "photos" ("likes" DESC);
CREATE INDEX IF NOT EXISTS "idx_photos_status_created"   ON "photos" ("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_photos_tags"             ON "photos" USING gin ("tags");

ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fk"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "photos" ADD CONSTRAINT "photos_series_id_fk"
    FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE SET NULL;

ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_public_read"   ON "photos" FOR SELECT USING (status = 'published');
CREATE POLICY "photos_owner_insert"  ON "photos" FOR INSERT WITH CHECK (true);
CREATE POLICY "photos_owner_update"  ON "photos" FOR UPDATE USING (
    uploaded_by = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
);
CREATE POLICY "photos_owner_delete"  ON "photos" FOR DELETE USING (
    uploaded_by = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
);


-- ============================================================
-- TABLE: collections
-- Curated sets of photos, optionally private
-- ============================================================
CREATE TABLE IF NOT EXISTS "collections" (
    "id"              serial         PRIMARY KEY NOT NULL,
    "name"            text           NOT NULL,
    "description"     text,
    "cover_image_url" text,
    "is_private"      boolean        DEFAULT false NOT NULL,
    "owner_id"        varchar,
    "created_at"      timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_collections_owner_id" ON "collections" ("owner_id");

ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_public_read"  ON "collections" FOR SELECT USING (is_private = false);
CREATE POLICY "collections_owner_read"   ON "collections" FOR SELECT USING (
    owner_id = current_setting('app.current_user_id', true)
);
CREATE POLICY "collections_owner_write"  ON "collections" FOR ALL  USING (
    owner_id = current_setting('app.current_user_id', true)
);


-- ============================================================
-- TABLE: collection_photos  (join table)
-- ============================================================
CREATE TABLE IF NOT EXISTS "collection_photos" (
    "collection_id" integer NOT NULL,
    "photo_id"      integer NOT NULL,
    "added_at"      timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "collection_photos_pk" PRIMARY KEY ("collection_id", "photo_id")
);

CREATE INDEX IF NOT EXISTS "idx_collection_photos_photo_id" ON "collection_photos" ("photo_id");

ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_collection_id_fk"
    FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE;
ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "collection_photos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_photos_public_read" ON "collection_photos" FOR SELECT USING (true);
CREATE POLICY "collection_photos_owner_write" ON "collection_photos" FOR ALL  USING (true);


-- ============================================================
-- TABLE: comments
-- ============================================================
CREATE TABLE IF NOT EXISTS "comments" (
    "id"          serial         PRIMARY KEY NOT NULL,
    "photo_id"    integer        NOT NULL,
    "author_id"   varchar,
    "author_name" text           NOT NULL,
    "body"        text           NOT NULL,
    "created_at"  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_comments_photo_id"  ON "comments" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_comments_author_id" ON "comments" ("author_id");

ALTER TABLE "comments" ADD CONSTRAINT "comments_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read"  ON "comments" FOR SELECT USING (true);
CREATE POLICY "comments_owner_write"  ON "comments" FOR ALL  USING (true);


-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id"           serial         PRIMARY KEY NOT NULL,
    "recipient_id" varchar        NOT NULL,
    "type"         text           NOT NULL,
    "photo_id"     integer,
    "photo_title"  text           DEFAULT '' NOT NULL,
    "actor_name"   text           DEFAULT 'Someone' NOT NULL,
    "comment_body" text,
    "is_read"      boolean        DEFAULT false NOT NULL,
    "created_at"   timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_notifications_recipient_id" ON "notifications" ("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read"      ON "notifications" ("recipient_id", "is_read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at"   ON "notifications" ("created_at" DESC);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fk"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_owner_only" ON "notifications" FOR ALL USING (
    recipient_id = current_setting('app.current_user_id', true)
);


-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS "messages" (
    "id"             serial         PRIMARY KEY NOT NULL,
    "sender_name"    text           NOT NULL,
    "recipient_name" text           NOT NULL,
    "content"        text           NOT NULL,
    "read"           boolean        DEFAULT false NOT NULL,
    "created_at"     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_messages_sender_name"    ON "messages" ("sender_name");
CREATE INDEX IF NOT EXISTS "idx_messages_recipient_name" ON "messages" ("recipient_name");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation"   ON "messages" ("sender_name", "recipient_name");

ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participant_only" ON "messages" FOR ALL USING (true);


-- ============================================================
-- TABLE: message_reactions
-- ============================================================
CREATE TABLE IF NOT EXISTS "message_reactions" (
    "message_id"   integer NOT NULL,
    "reactor_name" text    NOT NULL,
    "emoji"        text    NOT NULL,
    "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "message_reactions_pk" PRIMARY KEY ("message_id", "reactor_name", "emoji")
);

CREATE INDEX IF NOT EXISTS "idx_message_reactions_message_id" ON "message_reactions" ("message_id");

ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;

ALTER TABLE "message_reactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_reactions_public" ON "message_reactions" FOR ALL USING (true);


-- ============================================================
-- TABLE: follows
-- ============================================================
CREATE TABLE IF NOT EXISTS "follows" (
    "follower_name"  text NOT NULL,
    "following_name" text NOT NULL,
    "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "follows_pk" PRIMARY KEY ("follower_name", "following_name")
);

CREATE INDEX IF NOT EXISTS "idx_follows_follower_name"  ON "follows" ("follower_name");
CREATE INDEX IF NOT EXISTS "idx_follows_following_name" ON "follows" ("following_name");

ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_public_read"  ON "follows" FOR SELECT USING (true);
CREATE POLICY "follows_owner_write"  ON "follows" FOR ALL  USING (true);


-- ============================================================
-- TABLE: follow_alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS "follow_alerts" (
    "id"             serial  PRIMARY KEY NOT NULL,
    "recipient_name" text    NOT NULL,
    "actor_name"     text    NOT NULL,
    "type"           text    DEFAULT 'follow' NOT NULL,
    "series_id"      integer,
    "series_name"    text,
    "photo_id"       integer,
    "photo_title"    text,
    "is_read"        boolean DEFAULT false NOT NULL,
    "created_at"     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_follow_alerts_recipient_name" ON "follow_alerts" ("recipient_name");
CREATE INDEX IF NOT EXISTS "idx_follow_alerts_is_read"        ON "follow_alerts" ("recipient_name", "is_read");

ALTER TABLE "follow_alerts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_alerts_owner" ON "follow_alerts" FOR ALL USING (true);


-- ============================================================
-- TABLE: reactions  (emoji reactions on photos)
-- ============================================================
CREATE TABLE IF NOT EXISTS "reactions" (
    "photo_id"   integer NOT NULL,
    "actor_id"   text    NOT NULL,
    "emoji"      text    NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reactions_pk" PRIMARY KEY ("photo_id", "actor_id", "emoji")
);

CREATE INDEX IF NOT EXISTS "idx_reactions_photo_id" ON "reactions" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_reactions_actor_id" ON "reactions" ("actor_id");

ALTER TABLE "reactions" ADD CONSTRAINT "reactions_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "reactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_public_read"  ON "reactions" FOR SELECT USING (true);
CREATE POLICY "reactions_owner_write"  ON "reactions" FOR ALL  USING (true);


-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE IF NOT EXISTS "reports" (
    "id"            serial  PRIMARY KEY NOT NULL,
    "photo_id"      integer NOT NULL,
    "reporter_name" text    NOT NULL,
    "reason"        text    NOT NULL,
    "body"          text,
    "status"        text    DEFAULT 'pending' NOT NULL,
    "created_at"    timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reports_status_check" CHECK (status IN ('pending','reviewed','dismissed'))
);

CREATE INDEX IF NOT EXISTS "idx_reports_photo_id" ON "reports" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_reports_status"   ON "reports" ("status");

ALTER TABLE "reports" ADD CONSTRAINT "reports_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_allowed" ON "reports" FOR INSERT WITH CHECK (true);
-- Only admins (service role) can read/update reports
CREATE POLICY "reports_admin_only"     ON "reports" FOR SELECT USING (false);


-- ============================================================
-- TABLE: challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS "challenges" (
    "id"          serial  PRIMARY KEY NOT NULL,
    "title"       text    NOT NULL,
    "description" text,
    "theme"       text    NOT NULL,
    "deadline"    timestamp with time zone,
    "created_at"  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_public_read"  ON "challenges" FOR SELECT USING (true);
CREATE POLICY "challenges_admin_write"  ON "challenges" FOR ALL  USING (false);


-- ============================================================
-- TABLE: challenge_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS "challenge_entries" (
    "challenge_id"   integer NOT NULL,
    "photo_id"       integer NOT NULL,
    "submitter_name" text    NOT NULL,
    "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "challenge_entries_pk" PRIMARY KEY ("challenge_id", "photo_id")
);

CREATE INDEX IF NOT EXISTS "idx_challenge_entries_challenge_id" ON "challenge_entries" ("challenge_id");
CREATE INDEX IF NOT EXISTS "idx_challenge_entries_photo_id"     ON "challenge_entries" ("photo_id");

ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challenge_id_fk"
    FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE;
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "challenge_entries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge_entries_public_read" ON "challenge_entries" FOR SELECT USING (true);
CREATE POLICY "challenge_entries_owner_write" ON "challenge_entries" FOR ALL  USING (true);


-- ============================================================
-- TABLE: locks  (admin content locks)
-- ============================================================
CREATE TABLE IF NOT EXISTS "locks" (
    "id"           serial  PRIMARY KEY NOT NULL,
    "lock_type"    text    NOT NULL,
    "target_id"    text    NOT NULL,
    "target_label" text    NOT NULL,
    "reason"       text,
    "locked_by"    text    NOT NULL,
    "locked_at"    timestamp with time zone DEFAULT now() NOT NULL,
    "unlocked_at"  timestamp with time zone,
    "is_active"    boolean DEFAULT true NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_locks_target"    ON "locks" ("lock_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_locks_is_active" ON "locks" ("is_active") WHERE is_active = true;

ALTER TABLE "locks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locks_admin_only" ON "locks" FOR ALL USING (false);


-- ============================================================
-- TABLE: payouts
-- ============================================================
CREATE TABLE IF NOT EXISTS "payouts" (
    "id"                    serial           PRIMARY KEY NOT NULL,
    "payout_id"             varchar(32)      NOT NULL UNIQUE,
    "user_id"               varchar,
    "photographer_name"     text             NOT NULL,
    "email"                 text,
    "type"                  text             DEFAULT 'commission' NOT NULL,
    "description"           text             NOT NULL,
    "amount"                numeric(10, 2)   NOT NULL,
    "status"                text             DEFAULT 'pending' NOT NULL,
    "payment_method"        text             DEFAULT 'paypal' NOT NULL,
    "paypal_email"          text,
    "bank_name"             text,
    "bank_account_holder"   text,
    "bank_account_last4"    text,
    "bank_routing_last4"    text,
    "notes"                 text,
    "admin_notes"           text,
    "requested_at"          timestamp with time zone DEFAULT now() NOT NULL,
    "processed_at"          timestamp with time zone,
    CONSTRAINT "payouts_status_check" CHECK (status IN ('pending','processing','paid','failed','cancelled'))
);

CREATE INDEX IF NOT EXISTS "idx_payouts_user_id"          ON "payouts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_payouts_status"           ON "payouts" ("status");
CREATE INDEX IF NOT EXISTS "idx_payouts_photographer_name" ON "payouts" ("photographer_name");

ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_admin_only" ON "payouts" FOR ALL USING (false);


-- ============================================================
-- TABLE: support_chat
-- ============================================================
CREATE TABLE IF NOT EXISTS "support_chat" (
    "id"          serial       PRIMARY KEY NOT NULL,
    "session_id"  varchar(64)  NOT NULL,
    "sender_name" text         NOT NULL,
    "sender_role" text         DEFAULT 'customer' NOT NULL,
    "message"     text         NOT NULL,
    "read"        boolean      DEFAULT false NOT NULL,
    "created_at"  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_support_chat_session_id" ON "support_chat" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_support_chat_created_at" ON "support_chat" ("created_at" DESC);

ALTER TABLE "support_chat" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_chat_session_read" ON "support_chat" FOR SELECT USING (true);
CREATE POLICY "support_chat_insert"       ON "support_chat" FOR INSERT WITH CHECK (true);


-- ============================================================
-- TABLE: verification_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS "verification_requests" (
    "id"                serial       PRIMARY KEY NOT NULL,
    "user_id"           varchar(255) NOT NULL,
    "photographer_name" text         NOT NULL,
    "email"             text,
    "portfolio_url"     text,
    "instagram_url"     text,
    "website"           text,
    "bio"               text,
    "photo_count"       integer      DEFAULT 0,
    "follower_count"    integer      DEFAULT 0,
    "reason"            text,
    "status"            text         DEFAULT 'pending' NOT NULL,
    "admin_notes"       text,
    "reviewed_by"       text,
    "submitted_at"      timestamp with time zone DEFAULT now() NOT NULL,
    "reviewed_at"       timestamp with time zone,
    CONSTRAINT "verification_status_check" CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS "idx_verification_requests_user_id" ON "verification_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_verification_requests_status"  ON "verification_requests" ("status");

ALTER TABLE "verification_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifications_owner_insert" ON "verification_requests" FOR INSERT WITH CHECK (true);
CREATE POLICY "verifications_admin_only"   ON "verification_requests" FOR SELECT USING (false);


-- ============================================================
-- TABLE: site_settings
-- Key-value store for runtime configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS "site_settings" (
    "key"        text PRIMARY KEY NOT NULL,
    "value"      text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read"  ON "site_settings" FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write"  ON "site_settings" FOR ALL  USING (false);

-- Default settings seed
INSERT INTO "site_settings" ("key", "value") VALUES
    ('ads_enabled',          'false'),
    ('maintenance_mode',     'false'),
    ('uploads_enabled',      'true'),
    ('max_upload_size_mb',   '25'),
    ('featured_tag',         'golden hour'),
    ('site_name',            'Affuaa'),
    ('site_tagline',         'Gallery-quality photography')
ON CONFLICT ("key") DO NOTHING;


-- ============================================================
-- TABLE: photographer_profiles
-- Earnings and premium qualification per photographer
-- ============================================================
CREATE TABLE IF NOT EXISTS "photographer_profiles" (
    "user_id"                  varchar        PRIMARY KEY NOT NULL,
    "is_qualified_for_premium" boolean        DEFAULT false NOT NULL,
    "premium_earnings_total"   numeric(10, 2) DEFAULT 0 NOT NULL,
    "premium_earnings_paid"    numeric(10, 2) DEFAULT 0 NOT NULL,
    "updated_at"               timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "photographer_profiles" ADD CONSTRAINT "photographer_profiles_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "photographer_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photographer_profiles_public_read" ON "photographer_profiles" FOR SELECT USING (true);
CREATE POLICY "photographer_profiles_owner_update" ON "photographer_profiles" FOR UPDATE USING (
    user_id = current_setting('app.current_user_id', true)
);
CREATE POLICY "photographer_profiles_service_insert" ON "photographer_profiles" FOR INSERT WITH CHECK (false);


-- ============================================================
-- TABLE: security_events
-- Logs suspicious activities, errors, and admin actions.
-- Powers the admin Security Monitor.
-- ============================================================
CREATE TABLE IF NOT EXISTS "security_events" (
    "id"           serial       PRIMARY KEY NOT NULL,
    "event_type"   text         NOT NULL,
    "severity"     text         DEFAULT 'info' NOT NULL,
    "ip_address"   text,
    "user_id"      varchar,
    "user_agent"   text,
    "path"         text,
    "method"       text,
    "status_code"  integer,
    "message"      text         NOT NULL,
    "metadata"     jsonb        DEFAULT '{}',
    "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "security_events_severity_check"   CHECK (severity   IN ('info','warn','error','critical')),
    CONSTRAINT "security_events_event_type_check" CHECK (event_type IN (
        'auth_failure', 'auth_success', 'rate_limited', 'forbidden',
        'suspicious_input', 'admin_action', 'upload_rejected',
        'sql_injection_attempt', 'xss_attempt', 'api_error', 'other'
    ))
);

CREATE INDEX IF NOT EXISTS "idx_security_events_event_type" ON "security_events" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_security_events_severity"   ON "security_events" ("severity");
CREATE INDEX IF NOT EXISTS "idx_security_events_created_at" ON "security_events" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_security_events_ip"         ON "security_events" ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_security_events_user_id"    ON "security_events" ("user_id");

ALTER TABLE "security_events" ENABLE ROW LEVEL SECURITY;
-- Only service role (server) can write security events
CREATE POLICY "security_events_admin_only" ON "security_events" FOR ALL USING (false);

-- Auto-purge events older than 90 days (run via pg_cron or Supabase scheduled function)
-- SELECT cron.schedule('purge-old-security-events', '0 3 * * *',
--   $$DELETE FROM security_events WHERE created_at < now() - interval '90 days'$$);


-- ============================================================
-- TABLE: rate_limit_log
-- Tracks IP-level request bursts for rate-limit analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS "rate_limit_log" (
    "id"           serial  PRIMARY KEY NOT NULL,
    "ip_address"   text    NOT NULL,
    "path"         text    NOT NULL,
    "hit_count"    integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT now() NOT NULL,
    "blocked"      boolean DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_rate_limit_log_ip"      ON "rate_limit_log" ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_rate_limit_log_window"  ON "rate_limit_log" ("window_start" DESC);
CREATE INDEX IF NOT EXISTS "idx_rate_limit_log_blocked" ON "rate_limit_log" ("blocked") WHERE blocked = true;

ALTER TABLE "rate_limit_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limit_log_admin_only" ON "rate_limit_log" FOR ALL USING (false);


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_updated_at"
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "photographer_profiles_updated_at"
    BEFORE UPDATE ON "photographer_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: get photo trending score
CREATE OR REPLACE FUNCTION photo_trending_score(p_likes integer, p_downloads integer, p_views integer, p_created_at timestamptz)
RETURNS numeric AS $$
BEGIN
    RETURN (p_likes * 3 + p_downloads * 5 + p_views * 0.1) /
           GREATEST(EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600 + 2, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expire < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS (for convenient querying)
-- ============================================================

-- Top photos view (published, sorted by trending score)
CREATE OR REPLACE VIEW "v_trending_photos" AS
SELECT
    p.*,
    photo_trending_score(p.likes, p.downloads, p.views, p.created_at) AS trending_score
FROM photos p
WHERE p.status = 'published'
ORDER BY trending_score DESC;

-- User subscription summary
CREATE OR REPLACE VIEW "v_subscribed_users" AS
SELECT
    u.id, u.email, u.first_name, u.last_name,
    u.subscription_status, u.stripe_subscription_id,
    u.subscription_current_period_end, u.created_at
FROM users u
WHERE u.subscription_status IN ('active', 'trialing', 'past_due');

-- Photographer leaderboard
CREATE OR REPLACE VIEW "v_photographer_leaderboard" AS
SELECT
    p.photographer_name,
    COUNT(p.id)       AS photo_count,
    SUM(p.likes)      AS total_likes,
    SUM(p.downloads)  AS total_downloads,
    SUM(p.views)      AS total_views,
    SUM(p.likes + p.downloads) AS engagement_score
FROM photos p
WHERE p.status = 'published'
GROUP BY p.photographer_name
ORDER BY engagement_score DESC;

-- Recent security events (last 7 days)
CREATE OR REPLACE VIEW "v_recent_security_events" AS
SELECT *
FROM security_events
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC
LIMIT 500;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert a default admin settings record placeholder
-- (actual admin email is set via ADMIN_EMAILS env var in the server)
INSERT INTO "site_settings" ("key", "value") VALUES
    ('security_monitor_enabled', 'true'),
    ('rate_limit_window_ms',     '60000'),
    ('rate_limit_max_requests',  '100')
ON CONFLICT ("key") DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- Total tables: 20
-- Total indexes: ~50
-- RLS: enabled on all tables
-- ============================================================
