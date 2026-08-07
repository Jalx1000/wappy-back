import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessengerInboxTables1786200000000 implements MigrationInterface {
  name = 'CreateMessengerInboxTables1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "messenger_conversation" ("contactId" character varying, "lastMessageAt" TIMESTAMP, "psid" character varying NOT NULL, "peerName" character varying, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_messenger_conversation_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messenger_message" ("payload" jsonb, "sentAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "editedFromId" character varying, "source" character varying NOT NULL, "status" character varying, "mediaUrl" character varying, "mediaId" character varying, "content" character varying, "messageType" character varying NOT NULL, "direction" character varying NOT NULL, "externalId" character varying NOT NULL, "conversationId" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_messenger_message_id" PRIMARY KEY ("id"))`,
    );
    // Idempotency + lookup indexes (hand-added; must match the entity @Index names).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_messenger_conversation_conn_psid" ON "messenger_conversation" ("connectionId", "psid")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messenger_conversation_contact" ON "messenger_conversation" ("contactId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_messenger_message_conn_external" ON "messenger_message" ("connectionId", "externalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messenger_message_conversation" ON "messenger_message" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messenger_message_conn_sent_at" ON "messenger_message" ("connectionId", "sentAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messenger_message_conn_sent_at"`);
    await queryRunner.query(`DROP INDEX "IDX_messenger_message_conversation"`);
    await queryRunner.query(`DROP INDEX "UQ_messenger_message_conn_external"`);
    await queryRunner.query(`DROP INDEX "IDX_messenger_conversation_contact"`);
    await queryRunner.query(`DROP INDEX "UQ_messenger_conversation_conn_psid"`);
    await queryRunner.query(`DROP TABLE "messenger_message"`);
    await queryRunner.query(`DROP TABLE "messenger_conversation"`);
  }
}
