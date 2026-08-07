import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAdCampaignsAndMetrics1749500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ad_campaign',
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
            name: 'external_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'objective',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'budget',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'USD'",
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'date',
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
            columnNames: ['connection_id'],
            referencedTableName: 'connection',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'ad_campaign',
      new TableIndex({
        name: 'IDX_ad_campaign_brand_id',
        columnNames: ['brand_id'],
      }),
    );

    await queryRunner.createIndex(
      'ad_campaign',
      new TableIndex({
        name: 'IDX_ad_campaign_external_id',
        columnNames: ['external_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ad_metric_snapshot',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'campaign_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'brand_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'spend',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
          },
          {
            name: 'impressions',
            type: 'integer',
            default: 0,
          },
          {
            name: 'clicks',
            type: 'integer',
            default: 0,
          },
          {
            name: 'ctr',
            type: 'decimal',
            precision: 8,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'cpc',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'cpm',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'conversions',
            type: 'integer',
            default: 0,
          },
          {
            name: 'roas',
            type: 'decimal',
            precision: 8,
            scale: 4,
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
            columnNames: ['campaign_id'],
            referencedTableName: 'ad_campaign',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['brand_id'],
            referencedTableName: 'brand',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'ad_metric_snapshot',
      new TableIndex({
        name: 'IDX_ad_metric_snapshot_campaign_date',
        columnNames: ['campaign_id', 'date'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'ad_metric_snapshot',
      new TableIndex({
        name: 'IDX_ad_metric_snapshot_brand_date',
        columnNames: ['brand_id', 'date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ad_metric_snapshot');
    await queryRunner.dropTable('ad_campaign');
  }
}
