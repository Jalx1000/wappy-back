import { MigrationInterface, QueryRunner } from 'typeorm';

export class CentralizeContacts1785813922138 implements MigrationInterface {
  name = 'CentralizeContacts1785813922138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contact" ("mergedIntoContactId" character varying, "notes" character varying, "avatarUrl" character varying, "email" character varying, "phone" character varying, "displayName" character varying, "brandId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_brand" ON "contact" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "contact_identity" ("phone" character varying, "profileName" character varying, "handle" character varying, "externalId" character varying NOT NULL, "connectionId" integer, "channel" character varying NOT NULL, "contactId" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ead925f95a2dc807ba0c4fa8b6d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_identity_contact" ON "contact_identity" ("contactId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_contact_identity_channel_conn_external" ON "contact_identity" ("channel", "connectionId", "externalId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversation" ADD "contactId" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_conversation_contact" ON "whatsapp_conversation" ("contactId") `,
    );
    // whatsapp_contact is folded into the central contact/contact_identity model.
    // TypeORM does not auto-drop tables that no longer have an entity, so drop it here.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_whatsapp_contact_conn_phone"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_contact"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate whatsapp_contact as it was before centralization.
    await queryRunner.query(
      `CREATE TABLE "whatsapp_contact" ("firstName" character varying, "fullName" character varying, "phoneNumber" character varying NOT NULL, "connectionId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_052568d3d937c86b196bdfe353e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_contact_conn_phone" ON "whatsapp_contact" ("connectionId", "phoneNumber")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_whatsapp_conversation_contact"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversation" DROP COLUMN "contactId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_contact_identity_channel_conn_external"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contact_identity_contact"`,
    );
    await queryRunner.query(`DROP TABLE "contact_identity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_contact_brand"`);
    await queryRunner.query(`DROP TABLE "contact"`);
  }
}
