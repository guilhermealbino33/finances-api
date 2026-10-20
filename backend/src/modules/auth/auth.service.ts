import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthUser, LoginResponse, UserStatus } from '@finances/shared';
import { UsersService } from '../users';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user || user.status !== 'ATIVO') {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.usersService.touchLastLogin(user.id);

    const authUser = this.toAuthUser(user);
    return {
      access_token: this.signToken(authUser),
      user: authUser,
    };
  }

  async me(userId: number): Promise<AuthUser> {
    const user = await this.usersService.findById(userId);
    if (user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inativo');
    }
    return this.toAuthUser(user);
  }

  private signToken(user: AuthUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private toAuthUser(user: {
    id: number;
    name: string;
    email: string;
    status: UserStatus;
  }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    };
  }
}
