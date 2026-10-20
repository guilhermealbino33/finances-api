import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecurringSeries1765000000000 implements MigrationInterface {
  name = 'CreateRecurringSeries1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "recurring_series" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "section" character varying(30) NOT NULL,
        "account_id" integer,
        "default_amount" numeric(12,2),
        "total_installments" integer,
        "next_installment" integer NOT NULL DEFAULT 1,
        "due_rule" character varying(80),
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recurring_series" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recurring_series_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recurring_series_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_recurring_series_user_status" ON "recurring_series" ("user_id", "status")`,
    );

    await queryRunner.query(`
      ALTER TABLE "entries"
      ADD CONSTRAINT "FK_entries_series"
      FOREIGN KEY ("series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_entries_series"`);
    await queryRunner.query(`DROP INDEX "IDX_recurring_series_user_status"`);
    await queryRunner.query(`DROP TABLE "recurring_series"`);
  }
}
