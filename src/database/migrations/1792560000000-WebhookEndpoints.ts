import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebhookEndpoints1792560000000 implements MigrationInterface {
  name = 'WebhookEndpoints1792560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "webhook_endpoint" ("active" boolean NOT NULL DEFAULT true, "secret" character varying NOT NULL, "url" character varying NOT NULL, "brandId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_webhook_endpoint_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_webhook_endpoint_brandId" ON "webhook_endpoint" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_webhook_endpoint_brandId"`);
    await queryRunner.query(`DROP TABLE "webhook_endpoint"`);
  }
}
