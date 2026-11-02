import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductsSync1792600000000 implements MigrationInterface {
  name = 'ProductsSync1792600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "externalId" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "product" ADD "attributes" jsonb`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_brand_externalId" ON "product" ("brandId", "externalId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_product_brand_externalId"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "attributes"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "externalId"`);
  }
}
