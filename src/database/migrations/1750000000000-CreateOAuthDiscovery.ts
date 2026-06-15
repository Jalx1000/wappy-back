import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateOAuthDiscovery1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'oauth_discovery',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id', type: 'integer', isNullable: false },
          { name: 'channel', type: 'varchar', length: '40', isNullable: false },
          { name: 'triggered_brand_id', type: 'integer', isNullable: true },
          { name: 'accounts', type: 'jsonb', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'consumed_at', type: 'timestamp', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'oauth_discovery',
      new TableIndex({
        name: 'IDX_oauth_discovery_user_expires',
        columnNames: ['user_id', 'expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'oauth_discovery',
      new TableIndex({
        name: 'IDX_oauth_discovery_expires',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('oauth_discovery');
  }
}
