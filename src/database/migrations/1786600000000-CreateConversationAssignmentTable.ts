import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationAssignmentTable1786600000000 implements MigrationInterface {
  name = 'CreateConversationAssignmentTable1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversation_assignment" ("assignedTeamId" character varying, "assignedUserId" integer, "brandId" integer NOT NULL, "channel" character varying NOT NULL, "conversationId" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_conversation_assignment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_conversation_assignment_conversationId" ON "conversation_assignment" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversation_assignment_brand" ON "conversation_assignment" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_conversation_assignment_brand"`);
    await queryRunner.query(
      `DROP INDEX "UQ_conversation_assignment_conversationId"`,
    );
    await queryRunner.query(`DROP TABLE "conversation_assignment"`);
  }
}
