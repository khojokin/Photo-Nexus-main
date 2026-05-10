CREATE TABLE "photos" (
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

CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"owner_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "collection_photos" (
	"collection_id" integer NOT NULL,
	"photo_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_photos_collection_id_photo_id_pk" PRIMARY KEY("collection_id","photo_id")
);

CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"photo_id" integer NOT NULL,
	"author_id" varchar,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
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

CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_name" text NOT NULL,
	"recipient_name" text NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "follows" (
	"follower_name" text NOT NULL,
	"following_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_name_following_name_pk" PRIMARY KEY("follower_name","following_name")
);

CREATE TABLE "reactions" (
	"photo_id" integer NOT NULL,
	"actor_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_photo_id_actor_id_emoji_pk" PRIMARY KEY("photo_id","actor_id","emoji")
);

CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"photo_id" integer NOT NULL,
	"reporter_name" text NOT NULL,
	"reason" text NOT NULL,
	"body" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "challenge_entries" (
	"challenge_id" integer NOT NULL,
	"photo_id" integer NOT NULL,
	"submitter_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_entries_challenge_id_photo_id_pk" PRIMARY KEY("challenge_id","photo_id")
);

CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"theme" text NOT NULL,
	"deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "series" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"photographer_name" text NOT NULL,
	"cover_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comments" ADD CONSTRAINT "comments_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reports" ADD CONSTRAINT "reports_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
