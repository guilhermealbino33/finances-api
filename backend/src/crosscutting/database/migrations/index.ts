import { InitSchema1760000000000 } from './1760000000000-InitSchema';
import { CreateUsers1761000000000 } from './1761000000000-CreateUsers';
import { CreatePeriods1762000000000 } from './1762000000000-CreatePeriods';

/**
 * Histórico de migrations.
 * Bootstrap → users (#4) → periods (#5).
 */
export const migrations = [
  InitSchema1760000000000,
  CreateUsers1761000000000,
  CreatePeriods1762000000000,
];
