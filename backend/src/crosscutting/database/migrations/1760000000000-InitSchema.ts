import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline vazia do bootstrap (#1).
 * Entidades de domínio entram em issues seguintes (auth, períodos, lançamentos…).
 */
export class InitSchema1760000000000 implements MigrationInterface {
  name = 'InitSchema1760000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // no-op — schema de domínio nas próximas features
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
