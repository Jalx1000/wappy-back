import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReportSchedule1750300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'report_schedule',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'brandId', type: 'integer', isNullable: false },
          {
            name: 'type',
            type: 'varchar',
            length: '40',
            default: "'summary'",
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'varchar',
            length: '40',
            isNullable: false,
          },
          { name: 'dayOfWeek', type: 'integer', isNullable: true },
          { name: 'dayOfMonth', type: 'integer', isNullable: true },
          { name: 'hour', type: 'integer', default: 8, isNullable: false },
          {
            name: 'timezone',
            type: 'varchar',
            length: '64',
            default: "'America/La_Paz'",
            isNullable: false,
          },
          {
            name: 'sections',
            type: 'jsonb',
            default: "'[]'::jsonb",
            isNullable: false,
          },
          {
            name: 'memberUserIds',
            type: 'jsonb',
            default: "'[]'::jsonb",
            isNullable: false,
          },
          {
            name: 'extraEmails',
            type: 'jsonb',
            default: "'[]'::jsonb",
            isNullable: false,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          { name: 'lastRunAt', type: 'timestamptz', isNullable: true },
          { name: 'nextRunAt', type: 'timestamptz', isNullable: true },
          { name: 'createdByUserId', type: 'integer', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createIndex(
      'report_schedule',
      new TableIndex({
        name: 'IDX_report_schedule_brandId',
        columnNames: ['brandId'],
      }),
    );
    await queryRunner.createIndex(
      'report_schedule',
      new TableIndex({
        name: 'IDX_report_schedule_nextRunAt',
        columnNames: ['nextRunAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('report_schedule');
  }
}
