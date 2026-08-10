import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamTables1786500000000 implements MigrationInterface {
  name = 'CreateTeamTables1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "team" ("brandId" integer NOT NULL, "name" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_team_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_brandId" ON "team" ("brandId")`,
    );
    // Many-to-many Team.members ↔ User (TypeORM default join table naming).
    await queryRunner.query(
      `CREATE TABLE "team_members_user" ("teamId" uuid NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_team_members_user" PRIMARY KEY ("teamId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_members_teamId" ON "team_members_user" ("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_members_userId" ON "team_members_user" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_team_members_teamId" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" ADD CONSTRAINT "FK_team_members_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_team_members_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members_user" DROP CONSTRAINT "FK_team_members_teamId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_team_members_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_team_members_teamId"`);
    await queryRunner.query(`DROP TABLE "team_members_user"`);
    await queryRunner.query(`DROP INDEX "IDX_team_brandId"`);
    await queryRunner.query(`DROP TABLE "team"`);
  }
}
