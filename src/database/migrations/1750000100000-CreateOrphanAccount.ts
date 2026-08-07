import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrphanAccount1750000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orphan_account',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'channel', type: 'varchar', length: '40', isNullable: false },
          {
            name: 'account_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'account_handle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          { name: 'access_token', type: 'text', isNullable: false },
          { name: 'refresh_token', type: 'text', isNullable: true },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          {
            name: 'scopes',
            type: 'jsonb',
            default: "'[]'::jsonb",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
            isNullable: false,
          },
          {
            name: 'discovered_by_user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'discovered_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'orphan_account',
      new TableIndex({
        name: 'IDX_orphan_account_channel_accountid',
        columnNames: ['channel', 'account_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'orphan_account',
      new TableIndex({
        name: 'IDX_orphan_account_channel',
        columnNames: ['channel'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orphan_account');
  }
}
