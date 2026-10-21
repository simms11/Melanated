import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "newsletter_heading";
  ALTER TABLE "site_settings" DROP COLUMN "newsletter_body";
  ALTER TABLE "site_settings" DROP COLUMN "newsletter_form_action";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "newsletter_heading" varchar DEFAULT 'Get the Melanated Edit';
  ALTER TABLE "site_settings" ADD COLUMN "newsletter_body" varchar DEFAULT 'Be the first to know about new articles, exclusive interviews, events and more.';
  ALTER TABLE "site_settings" ADD COLUMN "newsletter_form_action" varchar;`)
}
