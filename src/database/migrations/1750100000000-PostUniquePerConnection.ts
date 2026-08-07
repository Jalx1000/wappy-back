import { MigrationInterface, QueryRunner } from 'typeorm';

// social_post.externalId was globally unique, so when the same Facebook/
// Instagram account was connected under several brands only the first
// connection ever owned the posts (ON CONFLICT(externalId) DO UPDATE never
// reassigns connectionId). Switch to a per-connection unique key so every
// brand keeps its own copy of each publication.
export class PostUniquePerConnection1750100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // externalId's uniqueness is backed by a constraint, so DROP INDEX is
    // rejected ("constraint requires it"); drop the constraint (which removes
    // its backing index), then the stray index if any remains.
    await queryRunner.query(
      `ALTER TABLE "social_post" DROP CONSTRAINT IF EXISTS "UQ_social_post_externalId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_social_post_externalId"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_social_post_conn_external" ON "social_post" ("connectionId", "externalId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_social_post_conn_external"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_social_post_externalId" ON "social_post" ("externalId")`,
    );
  }
}
