import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoriesTable1793595010994 implements MigrationInterface {
  name = 'CategoriesTable1793595010994';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("brandId" integer NOT NULL, "name" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f02288c736913717de6855e65" ON "category" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e5940f83086e4f66d5d28d8e94" ON "category" ("brandId", "name") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5940f83086e4f66d5d28d8e94"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f02288c736913717de6855e65"`,
    );
    await queryRunner.query(`DROP TABLE "category"`);
  }
}
