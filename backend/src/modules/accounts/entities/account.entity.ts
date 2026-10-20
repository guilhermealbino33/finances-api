import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { AccountType } from '@finances/shared';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('accounts')
@Unique('UQ_accounts_user_name', ['userId', 'name'])
@Index('IDX_accounts_user_active', ['userId', 'active'])
export class AccountEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: AccountType;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
