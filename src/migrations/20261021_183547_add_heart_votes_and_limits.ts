import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "heart_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"post_id" integer NOT NULL,
  	"voter" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "heart_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bucket" varchar NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "heart_votes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "heart_limits_id" integer;
  ALTER TABLE "heart_votes" ADD CONSTRAINT "heart_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "heart_votes_post_idx" ON "heart_votes" USING btree ("post_id");
  CREATE INDEX "heart_votes_updated_at_idx" ON "heart_votes" USING btree ("updated_at");
  CREATE INDEX "heart_votes_created_at_idx" ON "heart_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "post_voter_idx" ON "heart_votes" USING btree ("post_id","voter");
  CREATE UNIQUE INDEX "heart_limits_bucket_idx" ON "heart_limits" USING btree ("bucket");
  CREATE INDEX "heart_limits_updated_at_idx" ON "heart_limits" USING btree ("updated_at");
  CREATE INDEX "heart_limits_created_at_idx" ON "heart_limits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_heart_votes_fk" FOREIGN KEY ("heart_votes_id") REFERENCES "public"."heart_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_heart_limits_fk" FOREIGN KEY ("heart_limits_id") REFERENCES "public"."heart_limits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_heart_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("heart_votes_id");
  CREATE INDEX "payload_locked_documents_rels_heart_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("heart_limits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "heart_votes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "heart_limits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "heart_votes" CASCADE;
  DROP TABLE "heart_limits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_heart_votes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_heart_limits_fk";
  
  DROP INDEX "payload_locked_documents_rels_heart_votes_id_idx";
  DROP INDEX "payload_locked_documents_rels_heart_limits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "heart_votes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "heart_limits_id";`)
}
