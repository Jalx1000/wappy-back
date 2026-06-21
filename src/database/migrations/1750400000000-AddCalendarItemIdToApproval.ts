import { MigrationInterface, QueryRunner } from 'typeorm';

// Links an approval to the calendar item (publication) it gates, so approving
// in the Aprobaciones module transitions the publication from review ->
// scheduled and lets the auto-publish cron pick it up.
export class AddCalendarItemIdToApproval1750400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "approval" ADD COLUMN IF NOT EXISTS "calendar_item_id" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "approval" DROP COLUMN IF EXISTS "calendar_item_id"`,
    );
  }
}
