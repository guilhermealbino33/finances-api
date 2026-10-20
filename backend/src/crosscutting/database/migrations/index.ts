import { InitSchema1760000000000 } from './1760000000000-InitSchema';
import { CreateUsers1761000000000 } from './1761000000000-CreateUsers';
import { CreatePeriods1762000000000 } from './1762000000000-CreatePeriods';
import { CreateAccountsAndParties1763000000000 } from './1763000000000-CreateAccountsAndParties';
import { CreateEntries1764000000000 } from './1764000000000-CreateEntries';
import { CreateRecurringSeries1765000000000 } from './1765000000000-CreateRecurringSeries';

/**
 * Histórico de migrations.
 * … → entries (#7) → recurring_series (#9).
 */
export const migrations = [
  InitSchema1760000000000,
  CreateUsers1761000000000,
  CreatePeriods1762000000000,
  CreateAccountsAndParties1763000000000,
  CreateEntries1764000000000,
  CreateRecurringSeries1765000000000,
];
