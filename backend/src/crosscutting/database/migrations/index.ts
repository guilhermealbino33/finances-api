import { InitSchema1760000000000 } from './1760000000000-InitSchema';
import { CreateUsers1761000000000 } from './1761000000000-CreateUsers';
import { CreatePeriods1762000000000 } from './1762000000000-CreatePeriods';
import { CreateAccountsAndParties1763000000000 } from './1763000000000-CreateAccountsAndParties';
import { CreateEntries1764000000000 } from './1764000000000-CreateEntries';

/**
 * Histórico de migrations.
 * Bootstrap → users (#4) → periods (#5) → accounts/parties (#6) → entries (#7).
 */
export const migrations = [
  InitSchema1760000000000,
  CreateUsers1761000000000,
  CreatePeriods1762000000000,
  CreateAccountsAndParties1763000000000,
  CreateEntries1764000000000,
];
