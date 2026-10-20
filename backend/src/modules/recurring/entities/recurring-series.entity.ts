import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { EditableEntrySection, RecurringSeriesStatus } from '@finances/shared';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('recurring_series')
@Index('IDX_recurring_series_user_status', ['userId', 'status'])
export class RecurringSeriesEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  section: EditableEntrySection;

  @Column({ name: 'account_id', type: 'int', nullable: true })
  accountId: number | null;

  @ManyToOne(() => AccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity | null;

  @Column({
    name: 'default_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value == null ? null : Number(value)),
    },
  })
  defaultAmount: number | null;

  @Column({ name: 'total_installments', type: 'int', nullable: true })
  totalInstallments: number | null;

  @Column({ name: 'next_installment', type: 'int', default: 1 })
  nextInstallment: number;

  @Column({ name: 'due_rule', type: 'varchar', length: 80, nullable: true })
  dueRule: string | null;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: RecurringSeriesStatus;
}
