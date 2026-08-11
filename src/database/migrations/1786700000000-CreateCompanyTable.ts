import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyTable1786700000000 implements MigrationInterface {
  name = 'CreateCompanyTable1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company" ("notes" character varying, "seats" integer, "plan" character varying, "location" character varying, "industry" character varying, "domain" character varying, "brandId" integer NOT NULL, "name" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_company_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_brandId" ON "company" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_company_brandId"`);
    await queryRunner.query(`DROP TABLE "company"`);
  }
}
