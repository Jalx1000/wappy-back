import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * N orders per contact + WooCommerce detail. Drops the 1:1 unique index on
 * contactId, adds order detail columns, and makes (brandId, externalId) unique
 * so a retried checkout never duplicates. Safe to recreate: no production data.
 */
export class OrdersWooDetail1792580000000 implements MigrationInterface {
  name = 'OrdersWooDetail1792580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1:1 is gone — a contact can hold a lead + many purchase orders.
    await queryRunner.query(`DROP INDEX "IDX_order_contactId"`);
    await queryRunner.query(
      `ALTER TABLE "order" ADD "source" character varying NOT NULL DEFAULT 'lead'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "externalId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "orderNumber" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "order" ADD "items" jsonb`);
    await queryRunner.query(
      `CREATE INDEX "IDX_order_contactId" ON "order" ("contactId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_order_brandId_externalId" ON "order" ("brandId", "externalId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_brandId_externalId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_contactId"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "items"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "orderNumber"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "externalId"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "source"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_order_contactId" ON "order" ("contactId")`,
    );
  }
}
