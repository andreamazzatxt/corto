CREATE TABLE "admin_users" (
	"email" text PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"last_login" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url_id" uuid NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"referer" text,
	"country" text,
	"device_type" text
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" text NOT NULL,
	"subscription" jsonb NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "push_subscriptions_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "urls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"destination" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"expires_redirect" text,
	"created_by" text,
	"group_name" text,
	CONSTRAINT "urls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clicks_url_id_idx" ON "clicks" USING btree ("url_id");--> statement-breakpoint
CREATE INDEX "clicks_clicked_at_idx" ON "clicks" USING btree ("clicked_at");