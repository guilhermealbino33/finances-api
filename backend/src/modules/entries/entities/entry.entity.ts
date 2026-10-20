import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { EntrySection } from '@finances/shared';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { PartyEntity } from '../../parties/entities/party.entity';
import { PeriodEntity } from '../../periods/entities/period.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('entries')
@Index('IDX_entries_user_period_section', ['userId', 'periodId', 'section'])
@Index('IDX_entries_period', ['periodId'])
export class EntryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'period_id', type: 'int' })
  periodId: number;

  @ManyToOne(() => PeriodEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period: PeriodEntity;

  @Column({ type: 'varchar', length: 30 })
  section: EntrySection;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value == null ? 0 : Number(value)),
    },
  })
  amount: number;

  @Column({ name: 'due_label', type: 'varchar', length: 80, nullable: true })
  dueLabel: string | null;

  @Column({ name: 'installment_current', type: 'int', nullable: true })
  installmentCurrent: number | null;

  @Column({ name: 'installment_total', type: 'int', nullable: true })
  installmentTotal: number | null;

  @Column({ name: 'account_id', type: 'int', nullable: true })
  accountId: number | null;

  @ManyToOne(() => AccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity | null;

  @Column({ name: 'party_id', type: 'int', nullable: true })
  partyId: number | null;

  @ManyToOne(() => PartyEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'party_id' })
  party: PartyEntity | null;

  /** FK para RecurringSeries (#9) — coluna reservada. */
  @Column({ name: 'series_id', type: 'int', nullable: true })
  seriesId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder: number | null;
}
