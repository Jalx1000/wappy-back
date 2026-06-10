import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInsights1749400000000 implements MigrationInterface {
  name = 'CreateInsights1749400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "insight" (
        "id" SERIAL NOT NULL,
        "brandId" integer NOT NULL,
        "connectionId" integer,
        "period" character varying NOT NULL,
        "summary" text NOT NULL,
        "recommendations" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_insight_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_insight_brandId_period" UNIQUE ("brandId", "period")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_insight_brandId" ON "insight" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_insight_brandId"`);
    await queryRunner.query(`DROP TABLE "insight"`);
  }
}
