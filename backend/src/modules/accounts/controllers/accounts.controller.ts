import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AccountResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { CreateAccountDto } from '../dto/create-account.dto';
import { ListAccountsQueryDto } from '../dto/list-accounts-query.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { AccountsService } from '../services/accounts.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtValidatedUser,
    @Query() query: ListAccountsQueryDto,
  ): Promise<AccountResponse[]> {
    return this.accountsService.list(user.id, query.active);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountResponse> {
    return this.accountsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtValidatedUser,
    @Body() body: CreateAccountDto,
  ): Promise<AccountResponse> {
    return this.accountsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAccountDto,
  ): Promise<AccountResponse> {
    return this.accountsService.update(user.id, id, body);
  }
}
