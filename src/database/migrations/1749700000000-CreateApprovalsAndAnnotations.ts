import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateApprovalsAndAnnotations1749700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'approval',
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
            name: 'asset_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'requested_by_user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'reviewed_by_user_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'feedback',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'annotations',
            type: 'jsonb',
            default: "'[]'::jsonb",
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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
            columnNames: ['asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['requested_by_user_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['reviewed_by_user_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'approval',
      new TableIndex({
        name: 'IDX_approval_brand_id',
        columnNames: ['brand_id'],
      }),
    );

    await queryRunner.createIndex(
      'approval',
      new TableIndex({
        name: 'IDX_approval_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('approval');
  }
}
