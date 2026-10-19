import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationRatingTable1792384424463 implements MigrationInterface {
  name = 'CreateConversationRatingTable1792384424463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_team_members_teamId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_team_members_userId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_team_brandId"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_invitation_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_brand_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_conversation_assignment_conversationId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_conversation_assignment_brand"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_company_brandId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_agent_brand"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_team_members_teamId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_team_members_userId"`);
    await queryRunner.query(
      `CREATE TABLE "conversation_rating" ("comment" character varying, "brandId" integer NOT NULL, "conversationId" character varying NOT NULL, "channel" character varying NOT NULL, "score" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab891abce3915b8228765d71d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_096d457ffcf9fda211cb021c06" ON "agent" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b3f2c420a7871621010a4e1d21" ON "team_members_user" ("teamId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45db1cff3b87cc40512fb2963e" ON "team_members_user" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_b3f2c420a7871621010a4e1d212" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_45db1cff3b87cc40512fb2963ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_45db1cff3b87cc40512fb2963ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_b3f2c420a7871621010a4e1d212"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45db1cff3b87cc40512fb2963e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b3f2c420a7871621010a4e1d21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_096d457ffcf9fda211cb021c06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'`,
    );
    await queryRunner.query(`DROP TABLE "conversation_rating"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_team_members_userId" ON "team_members_user" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_members_teamId" ON "team_members_user" ("teamId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_brand" ON "agent" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_brandId" ON "company" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversation_assignment_brand" ON "conversation_assignment" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_conversation_assignment_conversationId" ON "conversation_assignment" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_brand_status" ON "invitation" ("brandId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_invitation_token" ON "invitation" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_brandId" ON "team" ("brandId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_team_members_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_team_members_teamId" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
