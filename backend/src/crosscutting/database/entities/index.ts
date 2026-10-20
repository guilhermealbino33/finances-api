import { AccountEntity } from '../../../modules/accounts/entities/account.entity';
import { EntryEntity } from '../../../modules/entries/entities/entry.entity';
import { PartyEntity } from '../../../modules/parties/entities/party.entity';
import { PeriodEntity } from '../../../modules/periods/entities/period.entity';
import { UserEntity } from '../../../modules/users/entities/user.entity';

/** Register TypeORM entities here as modules land (no globs — pack-friendly). */
export const entities = [
  UserEntity,
  PeriodEntity,
  AccountEntity,
  PartyEntity,
  EntryEntity,
];
