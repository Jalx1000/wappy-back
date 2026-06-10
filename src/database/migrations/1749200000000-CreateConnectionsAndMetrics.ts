import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConnectionsAndMetrics1749200000000
  implements MigrationInterface
{
  name = 'CreateConnectionsAndMetrics1749200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "connection" (
        "id" SERIAL NOT NULL,
        "brandId" integer NOT NULL,
        "channel" character varying NOT NULL,
        "accountHandle" character varying NOT NULL,
        "accountId" character varying NOT NULL,
        "accessToken" character varying NOT NULL,
        "refreshToken" character varying,
        "expiresAt" TIMESTAMPTZ,
        "status" character varying NOT NULL DEFAULT 'pending',
        "lastSyncAt" TIMESTAMPTZ,
        "scopes" jsonb NOT NULL DEFAULT '[]',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_connection_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_connection_brandId" ON "connection" ("brandId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "metric_snapshot" (
        "id" SERIAL NOT NULL,
        "connectionId" integer NOT NULL,
        "brandId" integer NOT NULL,
        "date" date NOT NULL,
        "metric" character varying NOT NULL,
        "value" DECIMAL(18,4) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_metric_snapshot_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_metric_snapshot_conn_metric_date"
          UNIQUE ("connectionId", "metric", "date")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_metric_snapshot_connectionId" ON "metric_snapshot" ("connectionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metric_snapshot_brandId" ON "metric_snapshot" ("brandId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "social_post" (
        "id" SERIAL NOT NULL,
        "brandId" integer NOT NULL,
        "connectionId" integer NOT NULL,
        "externalId" character varying NOT NULL,
        "publishedAt" TIMESTAMPTZ NOT NULL,
        "type" character varying NOT NULL,
        "caption" character varying,
        "mediaUrl" character varying,
        "metrics" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_social_post_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_social_post_externalId" UNIQUE ("externalId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_brandId" ON "social_post" ("brandId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_connectionId" ON "social_post" ("connectionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_social_post_connectionId"`);
    await queryRunner.query(`DROP INDEX "IDX_social_post_brandId"`);
    await queryRunner.query(`DROP TABLE "social_post"`);
    await queryRunner.query(`DROP INDEX "IDX_metric_snapshot_brandId"`);
    await queryRunner.query(`DROP INDEX "IDX_metric_snapshot_connectionId"`);
    await queryRunner.query(`DROP TABLE "metric_snapshot"`);
    await queryRunner.query(`DROP INDEX "IDX_connection_brandId"`);
    await queryRunner.query(`DROP TABLE "connection"`);
  }
}
