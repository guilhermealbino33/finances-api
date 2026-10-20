import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntries1764000000000 implements MigrationInterface {
  name = 'CreateEntries1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "entries" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "period_id" integer NOT NULL,
        "section" character varying(30) NOT NULL,
        "description" character varying(255) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "due_label" character varying(80),
        "installment_current" integer,
        "installment_total" integer,
        "account_id" integer,
        "party_id" integer,
        "series_id" integer,
        "notes" text,
        "sort_order" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_entries_period" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_entries_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_entries_party" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_entries_user_period_section" ON "entries" ("user_id", "period_id", "section")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entries_period" ON "entries" ("period_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_entries_period"`);
    await queryRunner.query(`DROP INDEX "IDX_entries_user_period_section"`);
    await queryRunner.query(`DROP TABLE "entries"`);
  }
}
