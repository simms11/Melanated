import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "page_content_home_community_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "page_content_community_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "page_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"home_hero_button_label" varchar DEFAULT 'Explore the latest' NOT NULL,
  	"home_hero_button_link" varchar DEFAULT '#latest' NOT NULL,
  	"home_featured_label" varchar DEFAULT 'Featured' NOT NULL,
  	"home_trending_title" varchar DEFAULT 'Trending now' NOT NULL,
  	"home_latest_eyebrow" varchar DEFAULT 'New stories' NOT NULL,
  	"home_latest_title" varchar DEFAULT 'The latest' NOT NULL,
  	"home_empty_title" varchar DEFAULT 'Coming soon' NOT NULL,
  	"home_empty_body" varchar DEFAULT 'Our first stories are on their way. Join the community to hear first.' NOT NULL,
  	"home_community_eyebrow" varchar DEFAULT 'More than a magazine' NOT NULL,
  	"home_community_heading" varchar DEFAULT 'A community of' NOT NULL,
  	"home_community_highlight" varchar DEFAULT 'go-getters' NOT NULL,
  	"home_community_intro" varchar DEFAULT 'Join a community of ambitious, creative and empowered Black women building the life they love.' NOT NULL,
  	"home_community_button_label" varchar DEFAULT 'Join the community' NOT NULL,
  	"home_community_button_link" varchar DEFAULT '/community' NOT NULL,
  	"community_eyebrow" varchar DEFAULT 'Community' NOT NULL,
  	"community_heading" varchar DEFAULT 'A space to connect, collaborate and' NOT NULL,
  	"community_highlight" varchar DEFAULT 'rise together' NOT NULL,
  	"community_intro" varchar DEFAULT 'Melanated Online is more than a magazine. It’s a community of Black women building beautiful lives, pursuing personal growth and creating successful businesses.' NOT NULL,
  	"community_whatsapp_label" varchar DEFAULT 'Join on WhatsApp' NOT NULL,
  	"community_whatsapp_pending_label" varchar DEFAULT 'WhatsApp link coming soon' NOT NULL,
  	"community_email_label" varchar DEFAULT 'Email us' NOT NULL,
  	"community_meta_description" varchar DEFAULT 'Connect with like-minded women, build relationships and encourage collaboration and empowerment.' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "page_content_home_community_features" ADD CONSTRAINT "page_content_home_community_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content_community_pillars" ADD CONSTRAINT "page_content_community_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_content_home_community_features_order_idx" ON "page_content_home_community_features" USING btree ("_order");
  CREATE INDEX "page_content_home_community_features_parent_id_idx" ON "page_content_home_community_features" USING btree ("_parent_id");
  CREATE INDEX "page_content_community_pillars_order_idx" ON "page_content_community_pillars" USING btree ("_order");
  CREATE INDEX "page_content_community_pillars_parent_id_idx" ON "page_content_community_pillars" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_content_home_community_features" CASCADE;
  DROP TABLE "page_content_community_pillars" CASCADE;
  DROP TABLE "page_content" CASCADE;`)
}
