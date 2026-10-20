import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import type { UserStatus } from '@finances/shared';
import { BaseEntity } from '../../../shared/entities/base.entity';

const BCRYPT_ROUNDS = 10;

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 72, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: 'ATIVO' })
  status: UserStatus;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
    }
  }
}
