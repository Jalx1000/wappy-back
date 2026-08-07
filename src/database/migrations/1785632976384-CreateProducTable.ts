import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducTable1785632976384 implements MigrationInterface {
  name = 'CreateProducTable1785632976384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brand_membership" DROP CONSTRAINT "FK_brand_membership_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" DROP CONSTRAINT "FK_brand_membership_brand"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" DROP CONSTRAINT "FK_brand_settings_brand"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_3980c1e12ff32a1fa8c5e37c490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" DROP CONSTRAINT "FK_de769aebea7fd097b60b5726237"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" DROP CONSTRAINT "FK_5f2a949d2cd6adc5ad8fa4a275d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" DROP CONSTRAINT "FK_65922d828824d21619195a2bf8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" DROP CONSTRAINT "FK_0ea6198b771e202bd244e97abdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" DROP CONSTRAINT "FK_ea359b979895d3d89c419cd9457"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" DROP CONSTRAINT "FK_c09737d6fe51c1942bcc79c671f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "FK_f305f9746b7f5949ff9506d694f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "FK_88d4a4de893ba0b4d65907b6ef1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "FK_1950dd5d945846d0bdbbc3c3951"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "FK_87f1fc83fa87ee570c2d6372bc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" DROP CONSTRAINT "FK_e71815ea5300dd33c0330a781b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" DROP CONSTRAINT "FK_85d05ad840637b5fba1b2b4ceed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" DROP CONSTRAINT "FK_87ac945f3e84d569f71441d8c17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" DROP CONSTRAINT "FK_0c1ffbc89e1de16dbfe56a6d365"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" DROP CONSTRAINT "FK_9f403fca2a63f896838f3e36b84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" DROP CONSTRAINT "FK_5000864b608df21e4cbbf5a1282"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_report_brandId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_report_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_report_schedule_brandId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_report_schedule_nextRunAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_brand_membership_user_brand"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_brand_membership_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_brand_membership_brandId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_brand_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notification_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_social_post_brandId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_social_post_connectionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_metric_snapshot_connectionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_metric_snapshot_brandId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_insight_brandId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inbox_message_brand_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_inbox_message_external_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_connection_brandId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_calendar_item_brand_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_calendar_item_scheduled_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_asset_brand_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_asset_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_approval_brand_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_approval_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_web_dim_snapshot_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_web_dim_snapshot_brand_date_dim"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad_metric_snapshot_campaign_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad_metric_snapshot_brand_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ad_campaign_brand_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad_campaign_external_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_oauth_discovery_user_expires"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_oauth_discovery_expires"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_orphan_account_channel_accountid"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_orphan_account_channel"`);
    await queryRunner.query(
      `ALTER TABLE "metric_snapshot" DROP CONSTRAINT "UQ_metric_snapshot_conn_metric_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insight" DROP CONSTRAINT "UQ_insight_brandId_period"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255), "price" numeric(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT '1', "image" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "category" character varying(255) NOT NULL, "brandId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb7d3d9dc1fae40293795ae39d" ON "product" ("brandId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "report" ALTER COLUMN "params" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "report_schedule" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "type" character varying NOT NULL DEFAULT 'summary'`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "frequency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "frequency" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "timezone" character varying NOT NULL DEFAULT 'America/La_Paz'`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" DROP COLUMN "customCss"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" ADD "customCss" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ALTER COLUMN "metadata" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "media_urls" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "metadata" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "tags" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "metadata" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "annotations" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_discovery" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "discovered_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f128996187715880a0c75cdd4d" ON "report" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ca722a0d10e69842a43322418" ON "report_schedule" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2981bc5b534c661a0aa970adc3" ON "report_schedule" ("nextRunAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b41b6bd226c4e71abe8fd2519d" ON "brand_membership" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69873c3c52b5bbe698eac62464" ON "brand_membership" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af7e2cb19fc6711b6ed599e8e2" ON "brand_membership" ("userId", "brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f4436285f5d5785c7fb0b28b30" ON "brand" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_928b7aa1754e08e1ed7052cb9d" ON "notification" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8220a94c598c7f2a1af98e26f5" ON "social_post" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_442cd47b5eec19693ada7bc6c8" ON "social_post" ("connectionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27546895a4cea475ad8764c3e1" ON "metric_snapshot" ("connectionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75dc249646a079f180bae4ee75" ON "metric_snapshot" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5b07bf8f023a8bbe4557e2d8b" ON "insight" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dba26bd63b2fd19dba5f5829d6" ON "inbox_message" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de769aebea7fd097b60b572623" ON "inbox_message" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d49124bd1d5df15d581e8e313" ON "connection" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91ef92f95a3f607652d67af663" ON "calendar_item" ("scheduled_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65922d828824d21619195a2bf8" ON "calendar_item" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37ac8e73568722867e6a1f8346" ON "asset" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea359b979895d3d89c419cd945" ON "asset" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f64ea05b79c06b96d1c046cd8a" ON "approval" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f305f9746b7f5949ff9506d694" ON "approval" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ba332123bbbcef640b9bbfb99" ON "web_dimension_snapshot" ("brand_id", "date", "dimension") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_abdb0b042cf5186bba109bb088" ON "web_dimension_snapshot" ("connection_id", "date", "dimension", "dimension_value") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3da12fd061749083ff9e68a4b" ON "ad_metric_snapshot" ("brand_id", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9c80d714833a737755c7c45e0c" ON "ad_metric_snapshot" ("campaign_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c20fe53e33e18d9a87cfefc80" ON "ad_campaign" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f403fca2a63f896838f3e36b8" ON "ad_campaign" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4aa574983cecd06a52268f1cab" ON "oauth_discovery" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13105ca19c3b3aee3753b9e62b" ON "oauth_discovery" ("user_id", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e80a0e9e675c2c03e1b4f7f728" ON "orphan_account" ("channel") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1d716c2f9118dcd7f03c6b9382" ON "orphan_account" ("channel", "account_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "metric_snapshot" ADD CONSTRAINT "UQ_85c9773dfbe1e59d20548289797" UNIQUE ("connectionId", "metric", "date")`,
    );
    await queryRunner.query(
      `ALTER TABLE "insight" ADD CONSTRAINT "UQ_6574710974d67dfd455e7e64079" UNIQUE ("brandId", "period")`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" ADD CONSTRAINT "FK_b41b6bd226c4e71abe8fd2519d3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" ADD CONSTRAINT "FK_69873c3c52b5bbe698eac62464d" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" ADD CONSTRAINT "FK_92b31fc7cb756b62a7ccf891816" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_bb7d3d9dc1fae40293795ae39d6" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_bb7d3d9dc1fae40293795ae39d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" DROP CONSTRAINT "FK_92b31fc7cb756b62a7ccf891816"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" DROP CONSTRAINT "FK_69873c3c52b5bbe698eac62464d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" DROP CONSTRAINT "FK_b41b6bd226c4e71abe8fd2519d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insight" DROP CONSTRAINT "UQ_6574710974d67dfd455e7e64079"`,
    );
    await queryRunner.query(
      `ALTER TABLE "metric_snapshot" DROP CONSTRAINT "UQ_85c9773dfbe1e59d20548289797"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1d716c2f9118dcd7f03c6b9382"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e80a0e9e675c2c03e1b4f7f728"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13105ca19c3b3aee3753b9e62b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4aa574983cecd06a52268f1cab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f403fca2a63f896838f3e36b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1c20fe53e33e18d9a87cfefc80"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c80d714833a737755c7c45e0c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3da12fd061749083ff9e68a4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_abdb0b042cf5186bba109bb088"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ba332123bbbcef640b9bbfb99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f305f9746b7f5949ff9506d694"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f64ea05b79c06b96d1c046cd8a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea359b979895d3d89c419cd945"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37ac8e73568722867e6a1f8346"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65922d828824d21619195a2bf8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91ef92f95a3f607652d67af663"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d49124bd1d5df15d581e8e313"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de769aebea7fd097b60b572623"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dba26bd63b2fd19dba5f5829d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5b07bf8f023a8bbe4557e2d8b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75dc249646a079f180bae4ee75"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27546895a4cea475ad8764c3e1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_442cd47b5eec19693ada7bc6c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8220a94c598c7f2a1af98e26f5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_928b7aa1754e08e1ed7052cb9d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4436285f5d5785c7fb0b28b30"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_af7e2cb19fc6711b6ed599e8e2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_69873c3c52b5bbe698eac62464"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b41b6bd226c4e71abe8fd2519d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2981bc5b534c661a0aa970adc3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ca722a0d10e69842a43322418"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f128996187715880a0c75cdd4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "discovered_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "metadata" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orphan_account" ALTER COLUMN "scopes" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_discovery" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "annotations" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "metadata" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "tags" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "metadata" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ALTER COLUMN "media_urls" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ALTER COLUMN "metadata" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" DROP COLUMN "customCss"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" ADD "customCss" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "timezone" character varying(64) NOT NULL DEFAULT 'America/La_Paz'`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" DROP COLUMN "frequency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "frequency" character varying(40) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "report_schedule" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "report_schedule" ADD "type" character varying(40) NOT NULL DEFAULT 'summary'`,
    );
    await queryRunner.query(
      `ALTER TABLE "report" ALTER COLUMN "params" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb7d3d9dc1fae40293795ae39d"`,
    );
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(
      `ALTER TABLE "inbox_message" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insight" ADD CONSTRAINT "UQ_insight_brandId_period" UNIQUE ("brandId", "period")`,
    );
    await queryRunner.query(
      `ALTER TABLE "metric_snapshot" ADD CONSTRAINT "UQ_metric_snapshot_conn_metric_date" UNIQUE ("connectionId", "date", "metric")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orphan_account_channel" ON "orphan_account" ("channel") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_orphan_account_channel_accountid" ON "orphan_account" ("account_id", "channel") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oauth_discovery_expires" ON "oauth_discovery" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oauth_discovery_user_expires" ON "oauth_discovery" ("expires_at", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad_campaign_external_id" ON "ad_campaign" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad_campaign_brand_id" ON "ad_campaign" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad_metric_snapshot_brand_date" ON "ad_metric_snapshot" ("brand_id", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ad_metric_snapshot_campaign_date" ON "ad_metric_snapshot" ("campaign_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_web_dim_snapshot_brand_date_dim" ON "web_dimension_snapshot" ("brand_id", "date", "dimension") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_web_dim_snapshot_unique" ON "web_dimension_snapshot" ("connection_id", "date", "dimension", "dimension_value") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_approval_status" ON "approval" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_approval_brand_id" ON "approval" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_type" ON "asset" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_brand_id" ON "asset" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_item_scheduled_at" ON "calendar_item" ("scheduled_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_item_brand_id" ON "calendar_item" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_connection_brandId" ON "connection" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_inbox_message_external_id" ON "inbox_message" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inbox_message_brand_id" ON "inbox_message" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_insight_brandId" ON "insight" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metric_snapshot_brandId" ON "metric_snapshot" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metric_snapshot_connectionId" ON "metric_snapshot" ("connectionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_connectionId" ON "social_post" ("connectionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_brandId" ON "social_post" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_user_id" ON "notification" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_brand_slug" ON "brand" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_brand_membership_brandId" ON "brand_membership" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_brand_membership_userId" ON "brand_membership" ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_brand_membership_user_brand" ON "brand_membership" ("brandId", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_schedule_nextRunAt" ON "report_schedule" ("nextRunAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_schedule_brandId" ON "report_schedule" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_status" ON "report" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_brandId" ON "report" ("brandId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ADD CONSTRAINT "FK_5000864b608df21e4cbbf5a1282" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaign" ADD CONSTRAINT "FK_9f403fca2a63f896838f3e36b84" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ADD CONSTRAINT "FK_0c1ffbc89e1de16dbfe56a6d365" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_metric_snapshot" ADD CONSTRAINT "FK_87ac945f3e84d569f71441d8c17" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ADD CONSTRAINT "FK_85d05ad840637b5fba1b2b4ceed" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_dimension_snapshot" ADD CONSTRAINT "FK_e71815ea5300dd33c0330a781b4" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_87f1fc83fa87ee570c2d6372bc0" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_1950dd5d945846d0bdbbc3c3951" FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_88d4a4de893ba0b4d65907b6ef1" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_f305f9746b7f5949ff9506d694f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ADD CONSTRAINT "FK_c09737d6fe51c1942bcc79c671f" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ADD CONSTRAINT "FK_ea359b979895d3d89c419cd9457" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ADD CONSTRAINT "FK_0ea6198b771e202bd244e97abdc" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_item" ADD CONSTRAINT "FK_65922d828824d21619195a2bf8f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" ADD CONSTRAINT "FK_5f2a949d2cd6adc5ad8fa4a275d" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbox_message" ADD CONSTRAINT "FK_de769aebea7fd097b60b5726237" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_3980c1e12ff32a1fa8c5e37c490" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_settings" ADD CONSTRAINT "FK_brand_settings_brand" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" ADD CONSTRAINT "FK_brand_membership_brand" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_membership" ADD CONSTRAINT "FK_brand_membership_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
