import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('periods')
@Unique('UQ_periods_user_year_month', ['userId', 'year', 'month'])
@Index('IDX_periods_user_year', ['userId', 'year'])
export class PeriodEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({
    name: 'caixa_budget',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value == null ? 0 : Number(value)),
    },
  })
  caixaBudget: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
