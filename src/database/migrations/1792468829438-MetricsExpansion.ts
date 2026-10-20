import { MigrationInterface, QueryRunner } from 'typeorm';

export class MetricsExpansion1792468829438 implements MigrationInterface {
  name = 'MetricsExpansion1792468829438';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversation_state" ("resolvedByUserId" integer, "resolvedAt" TIMESTAMP, "firstResponseAt" TIMESTAMP, "firstInboundAt" TIMESTAMP, "status" character varying NOT NULL, "brandId" integer NOT NULL, "channel" character varying NOT NULL, "conversationId" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_429f3e62602716d0d0392a65fa8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand" ADD "timezone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_rating" ADD "agentUserId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_rating" DROP COLUMN "agentUserId"`,
    );
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "timezone"`);
    await queryRunner.query(`DROP TABLE "conversation_state"`);
  }
}
