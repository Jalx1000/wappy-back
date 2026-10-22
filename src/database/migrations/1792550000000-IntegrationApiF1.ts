import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntegrationApiF11792550000000 implements MigrationInterface {
  name = 'IntegrationApiF11792550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "api_key" ("revokedAt" TIMESTAMP, "lastUsedAt" TIMESTAMP, "label" character varying, "environment" character varying NOT NULL, "keyPrefix" character varying NOT NULL, "keyHash" character varying NOT NULL, "brandId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_api_key_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_api_key_keyHash" ON "api_key" ("keyHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_key_brandId" ON "api_key" ("brandId")`,
    );
    await queryRunner.query(`ALTER TABLE "contact" ADD "tags" jsonb`);
    await queryRunner.query(`ALTER TABLE "contact" ADD "consent" jsonb`);
    await queryRunner.query(`ALTER TABLE "contact" ADD "metadata" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "consent"`);
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "tags"`);
    await queryRunner.query(`DROP INDEX "IDX_api_key_brandId"`);
    await queryRunner.query(`DROP INDEX "IDX_api_key_keyHash"`);
    await queryRunner.query(`DROP TABLE "api_key"`);
  }
}
