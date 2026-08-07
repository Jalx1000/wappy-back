import { MigrationInterface, QueryRunner } from 'typeorm';

// Ads now capture reach + frequency (Meta/TikTok report both natively). This
// enables the Alcance and Frecuencia KPIs and verifies Impresiones = Alcance ×
// Frecuencia. Existing rows default to 0 / null until the next sync backfills.
export class AddReachFrequencyToAdMetrics1750500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ADD COLUMN IF NOT EXISTS "reach" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ADD COLUMN IF NOT EXISTS "frequency" numeric(10,4)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" DROP COLUMN IF EXISTS "frequency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" DROP COLUMN IF EXISTS "reach"`,
    );
  }
}
