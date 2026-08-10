import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationTable1786400000000 implements MigrationInterface {
  name = 'CreateInvitationTable1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invitation" ("invitedByUserId" integer, "brandId" integer NOT NULL, "status" character varying NOT NULL, "token" character varying NOT NULL, "role" character varying, "phone" character varying, "email" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_invitation_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_invitation_token" ON "invitation" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_brand_status" ON "invitation" ("brandId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_invitation_brand_status"`);
    await queryRunner.query(`DROP INDEX "UQ_invitation_token"`);
    await queryRunner.query(`DROP TABLE "invitation"`);
  }
}
