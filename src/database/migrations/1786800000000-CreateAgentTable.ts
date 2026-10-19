import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentTable1786800000000 implements MigrationInterface {
  name = 'CreateAgentTable1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agent" ("brandId" integer NOT NULL, "name" character varying NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "provider" character varying NOT NULL DEFAULT 'anthropic', "model" character varying NOT NULL DEFAULT 'claude-sonnet-4-6', "systemPrompt" text, "effort" character varying, "toolsEnabled" text, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_agent_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_brand" ON "agent" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_agent_brand"`);
    await queryRunner.query(`DROP TABLE "agent"`);
  }
}
