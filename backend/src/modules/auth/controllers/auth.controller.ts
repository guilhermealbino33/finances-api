import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, LoginResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import type { JwtValidatedUser } from '../jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtValidatedUser): Promise<AuthUser> {
    return this.authService.me(user.id);
  }
}
