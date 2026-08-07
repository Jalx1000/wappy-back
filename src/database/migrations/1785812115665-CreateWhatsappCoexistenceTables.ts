import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWhatsappCoexistenceTables1785812115665 implements MigrationInterface {
  name = 'CreateWhatsappCoexistenceTables1785812115665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "whatsapp_sync_request" ("progress" integer, "phase" integer, "status" character varying, "syncType" character varying NOT NULL, "requestId" character varying, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb497c2d252baf8b6de45aa3295" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "whatsapp_message" ("sentAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "editedFromId" character varying, "source" character varying NOT NULL, "status" character varying, "mediaUrl" character varying, "mediaId" character varying, "content" character varying, "messageType" character varying NOT NULL, "direction" character varying NOT NULL, "externalId" character varying NOT NULL, "conversationId" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7b16d171c675c93098598a54d8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "whatsapp_contact" ("firstName" character varying, "fullName" character varying, "phoneNumber" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_052568d3d937c86b196bdfe353e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "whatsapp_conversation" ("lastMessageAt" TIMESTAMP, "waUserPhone" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7c80608a88aa885bd91d83bf84c" PRIMARY KEY ("id"))`,
    );
    // Idempotency + lookup indexes (hand-added; the generator does not emit them).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_message_conn_external" ON "whatsapp_message" ("connectionId", "externalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_message_conversation" ON "whatsapp_message" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_message_conn_sent_at" ON "whatsapp_message" ("connectionId", "sentAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_conversation_conn_user" ON "whatsapp_conversation" ("connectionId", "waUserPhone")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_contact_conn_phone" ON "whatsapp_contact" ("connectionId", "phoneNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_sync_request_connection" ON "whatsapp_sync_request" ("connectionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_whatsapp_sync_request_connection"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_whatsapp_contact_conn_phone"`);
    await queryRunner.query(`DROP INDEX "UQ_whatsapp_conversation_conn_user"`);
    await queryRunner.query(`DROP INDEX "IDX_whatsapp_message_conn_sent_at"`);
    await queryRunner.query(`DROP INDEX "IDX_whatsapp_message_conversation"`);
    await queryRunner.query(`DROP INDEX "UQ_whatsapp_message_conn_external"`);
    await queryRunner.query(`DROP TABLE "whatsapp_conversation"`);
    await queryRunner.query(`DROP TABLE "whatsapp_contact"`);
    await queryRunner.query(`DROP TABLE "whatsapp_message"`);
    await queryRunner.query(`DROP TABLE "whatsapp_sync_request"`);
  }
}
