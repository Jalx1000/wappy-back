import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateWebDimensionSnapshot1749900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'web_dimension_snapshot',
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
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'dimension',
            type: 'varchar',
            length: '16',
            isNullable: false,
          },
          {
            name: 'dimension_value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'sessions',
            type: 'integer',
            default: 0,
          },
          {
            name: 'users',
            type: 'integer',
            default: 0,
          },
          {
            name: 'conversions',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
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
            columnNames: ['connection_id'],
            referencedTableName: 'connection',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'web_dimension_snapshot',
      new TableIndex({
        name: 'IDX_web_dim_snapshot_unique',
        columnNames: ['connection_id', 'date', 'dimension', 'dimension_value'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'web_dimension_snapshot',
      new TableIndex({
        name: 'IDX_web_dim_snapshot_brand_date_dim',
        columnNames: ['brand_id', 'date', 'dimension'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('web_dimension_snapshot');
  }
}
