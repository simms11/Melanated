import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "whatsapp_url";
  ALTER TABLE "page_content" DROP COLUMN "community_whatsapp_label";
  ALTER TABLE "page_content" DROP COLUMN "community_whatsapp_pending_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "whatsapp_url" varchar;
  ALTER TABLE "page_content" ADD COLUMN "community_whatsapp_label" varchar DEFAULT 'Join on WhatsApp' NOT NULL;
  ALTER TABLE "page_content" ADD COLUMN "community_whatsapp_pending_label" varchar DEFAULT 'WhatsApp link coming soon' NOT NULL;`)
}
