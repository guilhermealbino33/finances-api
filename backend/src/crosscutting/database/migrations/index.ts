import { InitSchema1760000000000 } from './1760000000000-InitSchema';
import { CreateUsers1761000000000 } from './1761000000000-CreateUsers';

/**
 * Histórico de migrations.
 * Bootstrap: baseline no-op. Auth (#4): tabela users.
 */
export const migrations = [InitSchema1760000000000, CreateUsers1761000000000];
