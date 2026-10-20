import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeriods1762000000000 implements MigrationInterface {
  name = 'CreatePeriods1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "periods" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "caixa_budget" numeric(12,2) NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_periods" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_periods_user_year_month" UNIQUE ("user_id", "year", "month"),
        CONSTRAINT "FK_periods_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_periods_user_year" ON "periods" ("user_id", "year")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_periods_user_year"`);
    await queryRunner.query(`DROP TABLE "periods"`);
  }
}
