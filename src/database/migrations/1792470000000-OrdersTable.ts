import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrdersTable1792470000000 implements MigrationInterface {
  name = 'OrdersTable1792470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "order" ("notes" character varying, "currency" character varying NOT NULL DEFAULT 'USD', "total" integer NOT NULL DEFAULT 0, "status" character varying NOT NULL, "contactId" character varying NOT NULL, "brandId" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_order_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_order_contactId" ON "order" ("contactId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_brandId" ON "order" ("brandId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_brandId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_contactId"`);
    await queryRunner.query(`DROP TABLE "order"`);
  }
}
