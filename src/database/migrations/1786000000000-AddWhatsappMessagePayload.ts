import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappMessagePayload1786000000000 implements MigrationInterface {
  name = 'AddWhatsappMessagePayload1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_message" ADD "payload" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_message" DROP COLUMN "payload"`,
    );
  }
}
