import { MigrationInterface, QueryRunner } from 'typeorm';

// Reports now store the full aggregated payload (social + web + ads + executive
// summary) as JSON in the DB, rendered in-app and printed to PDF. Previously the
// processor wrote a JSON file to the worker's /tmp which the api could not serve.
export class AddReportData1750200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "report" ADD COLUMN IF NOT EXISTS "data" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "report" DROP COLUMN IF EXISTS "data"`,
    );
  }
}
