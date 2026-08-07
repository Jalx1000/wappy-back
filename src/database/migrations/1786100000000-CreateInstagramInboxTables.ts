import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInstagramInboxTables1786100000000 implements MigrationInterface {
  name = 'CreateInstagramInboxTables1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instagram_conversation" ("contactId" character varying, "lastMessageAt" TIMESTAMP, "igUserId" character varying NOT NULL, "peerUsername" character varying, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_instagram_conversation_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "instagram_message" ("payload" jsonb, "sentAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "editedFromId" character varying, "source" character varying NOT NULL, "status" character varying, "mediaUrl" character varying, "mediaId" character varying, "content" character varying, "messageType" character varying NOT NULL, "direction" character varying NOT NULL, "externalId" character varying NOT NULL, "conversationId" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_instagram_message_id" PRIMARY KEY ("id"))`,
    );
    // Idempotency + lookup indexes (hand-added; must match the entity @Index names).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_instagram_conversation_conn_user" ON "instagram_conversation" ("connectionId", "igUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_instagram_conversation_contact" ON "instagram_conversation" ("contactId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_instagram_message_conn_external" ON "instagram_message" ("connectionId", "externalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_instagram_message_conversation" ON "instagram_message" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_instagram_message_conn_sent_at" ON "instagram_message" ("connectionId", "sentAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_instagram_message_conn_sent_at"`);
    await queryRunner.query(`DROP INDEX "IDX_instagram_message_conversation"`);
    await queryRunner.query(`DROP INDEX "UQ_instagram_message_conn_external"`);
    await queryRunner.query(`DROP INDEX "IDX_instagram_conversation_contact"`);
    await queryRunner.query(`DROP INDEX "UQ_instagram_conversation_conn_user"`);
    await queryRunner.query(`DROP TABLE "instagram_message"`);
    await queryRunner.query(`DROP TABLE "instagram_conversation"`);
  }
}
