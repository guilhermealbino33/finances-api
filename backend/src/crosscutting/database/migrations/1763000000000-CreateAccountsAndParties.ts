import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsAndParties1763000000000 implements MigrationInterface {
  name = 'CreateAccountsAndParties1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "name" character varying(120) NOT NULL,
        "type" character varying(20) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_user_name" UNIQUE ("user_id", "name"),
        CONSTRAINT "FK_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_user_active" ON "accounts" ("user_id", "active")`,
    );

    await queryRunner.query(`
      CREATE TABLE "parties" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "name" character varying(120) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parties" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_parties_user_name" UNIQUE ("user_id", "name"),
        CONSTRAINT "FK_parties_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_parties_user_active" ON "parties" ("user_id", "active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_parties_user_active"`);
    await queryRunner.query(`DROP TABLE "parties"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_user_active"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
