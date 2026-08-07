import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateNotificationsAndInbox1749800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'brand_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['brand_id'],
            referencedTableName: 'brand',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'notification',
      new TableIndex({
        name: 'IDX_notification_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inbox_message',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'brand_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'connection_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'from_handle',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'from_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'media_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'parent_external_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'new'",
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['brand_id'],
            referencedTableName: 'brand',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['connection_id'],
            referencedTableName: 'connection',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'inbox_message',
      new TableIndex({
        name: 'IDX_inbox_message_brand_id',
        columnNames: ['brand_id'],
      }),
    );

    await queryRunner.createIndex(
      'inbox_message',
      new TableIndex({
        name: 'IDX_inbox_message_external_id',
        columnNames: ['external_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inbox_message');
    await queryRunner.dropTable('notification');
  }
}
