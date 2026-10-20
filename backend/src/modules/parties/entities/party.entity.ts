import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('parties')
@Unique('UQ_parties_user_name', ['userId', 'name'])
@Index('IDX_parties_user_active', ['userId', 'active'])
export class PartyEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
