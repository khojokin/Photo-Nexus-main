-- ============================================================
-- Photo Nexus — Full Database Schema
-- ============================================================

-- ------------------------------------------------------------
-- SESSIONS (required for auth — do not drop)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar PRIMARY KEY NOT NULL,
    "sess" jsonb NOT NULL,
    "expire" timestamp NOT NULL
);

-- ------------------------------------------------------------
-- USERS (required for auth — do not drop)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar UNIQUE,
    "role" text DEFAULT 'user' NOT NULL,
    "password_hash" varchar,
    "first_name" varchar,
    "last_name" varchar,
    "profile_image_url" varchar,
    "bio" text,
    "location" text,
    "website" text,
    "instagram" text,
    "twitter" text,
    "equipment" text[] DEFAULT '{}',
    "style_tags" text[] DEFAULT '{}',
    "availability" text DEFAULT 'available',
    "hiring_url" text,
    "accent_color" text,
    "featured_photo_id" integer,
    "profile_views" integer DEFAULT 0 NOT NULL,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "subscription_status" text DEFAULT 'free' NOT NULL,
    "subscription_current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- USER ROLES (DB-level admin/permission model)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" varchar NOT NULL,
    "role" text NOT NULL,
    "granted_by" varchar,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);

-- ------------------------------------------------------------
-- SERIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "series" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "photographer_name" text NOT NULL,
    "cover_image_url" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- PHOTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "photos" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "image_url" text NOT NULL,
    "blur_hash" text,
    "width" integer DEFAULT 1920 NOT NULL,
    "height" integer DEFAULT 1280 NOT NULL,
    "photographer_name" text NOT NULL,
    "photographer_avatar_url" text,
    "tags" text[] DEFAULT '{}' NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "downloads" integer DEFAULT 0 NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "content_warning" boolean DEFAULT false NOT NULL,
    "uploaded_by" varchar,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "publish_at" timestamp with time zone,
    "series_id" integer,
    "camera" text,
    "lens" text,
    "aperture" text,
    "shutter_speed" text,
    "iso" integer,
    "focal_length" text,
    "license" text DEFAULT 'cc0' NOT NULL,
    "status" text DEFAULT 'published' NOT NULL
);
-- ------------------------------------------------------------
-- COLLECTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "collections" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "cover_image_url" text,
    "is_private" boolean DEFAULT false NOT NULL,
    "owner_id" varchar,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- COLLECTION PHOTOS (join table)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "collection_photos" (
    "collection_id" integer NOT NULL,
    "photo_id" integer NOT NULL,
    "added_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "collection_photos_collection_id_photo_id_pk" PRIMARY KEY("collection_id","photo_id")
);

-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "comments" (
    "id" serial PRIMARY KEY NOT NULL,
    "photo_id" integer NOT NULL,
    "author_id" varchar,
    "author_name" text NOT NULL,
    "body" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "recipient_id" varchar NOT NULL,
    "type" text NOT NULL,
    "photo_id" integer,
    "photo_title" text DEFAULT '' NOT NULL,
    "actor_name" text DEFAULT 'Someone' NOT NULL,
    "comment_body" text,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "sender_name" text NOT NULL,
    "recipient_name" text NOT NULL,
    "content" text NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- MESSAGE REACTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "message_reactions" (
    "message_id" integer NOT NULL,
    "reactor_name" text NOT NULL,
    "emoji" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "message_reactions_message_id_reactor_name_emoji_pk" PRIMARY KEY("message_id","reactor_name","emoji")
);

-- ------------------------------------------------------------
-- FOLLOWS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "follows" (
    "follower_name" text NOT NULL,
    "following_name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "follows_follower_name_following_name_pk" PRIMARY KEY("follower_name","following_name")
);

-- ------------------------------------------------------------
-- FOLLOW ALERTS (in-app feed for follow events)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "follow_alerts" (
    "id" serial PRIMARY KEY NOT NULL,
    "recipient_name" text NOT NULL,
    "actor_name" text NOT NULL,
    "type" text DEFAULT 'follow' NOT NULL,
    "series_id" integer,
    "series_name" text,
    "photo_id" integer,
    "photo_title" text,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- REACTIONS (emoji reactions on photos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reactions" (
    "photo_id" integer NOT NULL,
    "actor_id" text NOT NULL,
    "emoji" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reactions_photo_id_actor_id_emoji_pk" PRIMARY KEY("photo_id","actor_id","emoji")
);

-- ------------------------------------------------------------
-- REPORTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "photo_id" integer NOT NULL,
    "reporter_name" text NOT NULL,
    "reason" text NOT NULL,
    "body" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- CHALLENGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "challenges" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "theme" text NOT NULL,
    "deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- CHALLENGE ENTRIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "challenge_entries" (
    "challenge_id" integer NOT NULL,
    "photo_id" integer NOT NULL,
    "submitter_name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "challenge_entries_challenge_id_photo_id_pk" PRIMARY KEY("challenge_id","photo_id")
);

-- ------------------------------------------------------------
-- LOCKS (admin content locks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "locks" (
    "id" serial PRIMARY KEY NOT NULL,
    "lock_type" text NOT NULL,
    "target_id" text NOT NULL,
    "target_label" text NOT NULL,
    "reason" text,
    "locked_by" text NOT NULL,
    "locked_at" timestamp with time zone DEFAULT now() NOT NULL,
    "unlocked_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL
);

-- ------------------------------------------------------------
-- PAYOUTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" serial PRIMARY KEY NOT NULL,
    "payout_id" varchar(32) NOT NULL UNIQUE,
    "user_id" varchar,
    "photographer_name" text NOT NULL,
    "email" text,
    "type" text DEFAULT 'commission' NOT NULL,
    "description" text NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "payment_method" text DEFAULT 'paypal' NOT NULL,
    "paypal_email" text,
    "bank_name" text,
    "bank_account_holder" text,
    "bank_account_last4" text,
    "bank_routing_last4" text,
    "notes" text,
    "admin_notes" text,
    "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
    "processed_at" timestamp with time zone
);

-- ------------------------------------------------------------
-- SUPPORT CHAT
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "support_chat" (
    "id" serial PRIMARY KEY NOT NULL,
    "session_id" varchar(64) NOT NULL,
    "sender_name" text NOT NULL,
    "sender_role" text DEFAULT 'customer' NOT NULL,
    "message" text NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------
-- VERIFICATION REQUESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "verification_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" varchar(255) NOT NULL,
    "photographer_name" text NOT NULL,
    "email" text,
    "portfolio_url" text,
    "instagram_url" text,
    "website" text,
    "bio" text,
    "photo_count" integer DEFAULT 0,
    "follower_count" integer DEFAULT 0,
    "reason" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "admin_notes" text,
    "reviewed_by" text,
    "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
    "reviewed_at" timestamp with time zone
);

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_users_id_fk"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "photos" ADD CONSTRAINT "photos_series_id_series_id_fk"
    FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE SET NULL;

ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk"
    FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_collection_id_collections_id_fk"
    FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE;

ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;

ALTER TABLE "reactions" ADD CONSTRAINT "reactions_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challenge_id_challenges_id_fk"
    FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE;

ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_photo_id_photos_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE;

-- ============================================================
-- INDEXES
-- ============================================================

-- Sessions
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");

-- Users
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");

-- User roles
CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "user_roles" ("role");

-- Photos
CREATE INDEX IF NOT EXISTS "idx_photos_status" ON "photos" ("status");
CREATE INDEX IF NOT EXISTS "idx_photos_photographer_name" ON "photos" ("photographer_name");
CREATE INDEX IF NOT EXISTS "idx_photos_uploaded_by" ON "photos" ("uploaded_by");
CREATE INDEX IF NOT EXISTS "idx_photos_series_id" ON "photos" ("series_id");
CREATE INDEX IF NOT EXISTS "idx_photos_is_featured" ON "photos" ("is_featured") WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS "idx_photos_created_at" ON "photos" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_photos_likes" ON "photos" ("likes" DESC);
CREATE INDEX IF NOT EXISTS "idx_photos_status_created" ON "photos" ("status", "created_at" DESC);

-- Collections
CREATE INDEX IF NOT EXISTS "idx_collections_owner_id" ON "collections" ("owner_id");

-- Collection photos
CREATE INDEX IF NOT EXISTS "idx_collection_photos_photo_id" ON "collection_photos" ("photo_id");

-- Comments
CREATE INDEX IF NOT EXISTS "idx_comments_photo_id" ON "comments" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_comments_author_id" ON "comments" ("author_id");

-- Notifications
CREATE INDEX IF NOT EXISTS "idx_notifications_recipient_id" ON "notifications" ("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("recipient_id", "is_read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at" DESC);

-- Messages
CREATE INDEX IF NOT EXISTS "idx_messages_sender_name" ON "messages" ("sender_name");
CREATE INDEX IF NOT EXISTS "idx_messages_recipient_name" ON "messages" ("recipient_name");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation" ON "messages" ("sender_name", "recipient_name");

-- Message reactions
CREATE INDEX IF NOT EXISTS "idx_message_reactions_message_id" ON "message_reactions" ("message_id");

-- Follows
CREATE INDEX IF NOT EXISTS "idx_follows_follower_name" ON "follows" ("follower_name");
CREATE INDEX IF NOT EXISTS "idx_follows_following_name" ON "follows" ("following_name");

-- Follow alerts
CREATE INDEX IF NOT EXISTS "idx_follow_alerts_recipient_name" ON "follow_alerts" ("recipient_name");
CREATE INDEX IF NOT EXISTS "idx_follow_alerts_is_read" ON "follow_alerts" ("recipient_name", "is_read");

-- Reactions
CREATE INDEX IF NOT EXISTS "idx_reactions_photo_id" ON "reactions" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_reactions_actor_id" ON "reactions" ("actor_id");

-- Reports
CREATE INDEX IF NOT EXISTS "idx_reports_photo_id" ON "reports" ("photo_id");
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports" ("status");

-- Challenge entries
CREATE INDEX IF NOT EXISTS "idx_challenge_entries_challenge_id" ON "challenge_entries" ("challenge_id");
CREATE INDEX IF NOT EXISTS "idx_challenge_entries_photo_id" ON "challenge_entries" ("photo_id");

-- Series
CREATE INDEX IF NOT EXISTS "idx_series_photographer_name" ON "series" ("photographer_name");

-- Locks
CREATE INDEX IF NOT EXISTS "idx_locks_target" ON "locks" ("lock_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_locks_is_active" ON "locks" ("is_active") WHERE is_active = true;

-- Payouts
CREATE INDEX IF NOT EXISTS "idx_payouts_user_id" ON "payouts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_payouts_status" ON "payouts" ("status");
CREATE INDEX IF NOT EXISTS "idx_payouts_photographer_name" ON "payouts" ("photographer_name");

-- Support chat
CREATE INDEX IF NOT EXISTS "idx_support_chat_session_id" ON "support_chat" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_support_chat_created_at" ON "support_chat" ("created_at" DESC);

-- Verification requests
CREATE INDEX IF NOT EXISTS "idx_verification_requests_user_id" ON "verification_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_verification_requests_status" ON "verification_requests" ("status");
