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
import type { PartyResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { CreatePartyDto } from '../dto/create-party.dto';
import { ListPartiesQueryDto } from '../dto/list-parties-query.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { PartiesService } from '../services/parties.service';

@Controller('parties')
@UseGuards(JwtAuthGuard)
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtValidatedUser,
    @Query() query: ListPartiesQueryDto,
  ): Promise<PartyResponse[]> {
    return this.partiesService.list(user.id, query.active);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PartyResponse> {
    return this.partiesService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtValidatedUser,
    @Body() body: CreatePartyDto,
  ): Promise<PartyResponse> {
    return this.partiesService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePartyDto,
  ): Promise<PartyResponse> {
    return this.partiesService.update(user.id, id, body);
  }
}
