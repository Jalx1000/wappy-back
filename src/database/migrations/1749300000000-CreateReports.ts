import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReports1749300000000 implements MigrationInterface {
  name = 'CreateReports1749300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "report" (
        "id" SERIAL NOT NULL,
        "brandId" integer NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "params" jsonb NOT NULL DEFAULT '{}',
        "fileUrl" character varying,
        "errorMessage" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_report_brandId" ON "report" ("brandId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_status" ON "report" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_report_status"`);
    await queryRunner.query(`DROP INDEX "IDX_report_brandId"`);
    await queryRunner.query(`DROP TABLE "report"`);
  }
}
