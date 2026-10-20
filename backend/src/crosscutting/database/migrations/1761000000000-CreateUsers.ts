import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1761000000000 implements MigrationInterface {
  name = 'CreateUsers1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(72) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'ATIVO',
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
