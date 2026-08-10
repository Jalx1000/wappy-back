import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvailability1786300000000 implements MigrationInterface {
  name = 'AddUserAvailability1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "availability" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "availability"`);
  }
}
