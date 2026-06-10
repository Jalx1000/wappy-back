import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrands1749000000000 implements MigrationInterface {
  name = 'CreateBrands1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend roles table with new role IDs (3, 4, 5) — handled by seed
    // Brands table
    await queryRunner.query(`
      CREATE TABLE "brand" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_brand_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_brand_slug" ON "brand" ("slug")`,
    );

    // Brand memberships table (user ↔ brand ↔ role)
    await queryRunner.query(`
      CREATE TABLE "brand_membership" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "brandId" integer NOT NULL,
        "role" character varying NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brand_membership_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_brand_membership_user" FOREIGN KEY ("userId")
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_brand_membership_brand" FOREIGN KEY ("brandId")
          REFERENCES "brand"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_brand_membership_user_brand" ON "brand_membership" ("userId", "brandId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_brand_membership_userId" ON "brand_membership" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_brand_membership_brandId" ON "brand_membership" ("brandId")`,
    );

    // Brand settings (white-label config per brand)
    await queryRunner.query(`
      CREATE TABLE "brand_settings" (
        "id" SERIAL NOT NULL,
        "brandId" integer NOT NULL,
        "primaryColor" character varying,
        "secondaryColor" character varying,
        "logoPath" character varying,
        "customDomain" character varying,
        "contactEmail" character varying,
        "customCss" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brand_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_brand_settings_brandId" UNIQUE ("brandId"),
        CONSTRAINT "FK_brand_settings_brand" FOREIGN KEY ("brandId")
          REFERENCES "brand"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "brand_settings"`);
    await queryRunner.query(`DROP INDEX "IDX_brand_membership_brandId"`);
    await queryRunner.query(`DROP INDEX "IDX_brand_membership_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_brand_membership_user_brand"`);
    await queryRunner.query(`DROP TABLE "brand_membership"`);
    await queryRunner.query(`DROP INDEX "IDX_brand_slug"`);
    await queryRunner.query(`DROP TABLE "brand"`);
  }
}
