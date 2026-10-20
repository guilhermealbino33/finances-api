import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig, resolveJwtSecret } from '../../crosscutting/config';
import { UsersService } from '../users';

export interface JwtPayload {
  sub: number;
  email?: string;
}

export interface JwtValidatedUser {
  id: number;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(auth.jwtSecret),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Payload inválido');
    }

    const user = await this.usersService.findById(payload.sub);
    if (user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inativo');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
