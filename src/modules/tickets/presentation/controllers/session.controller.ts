import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { CreateSessionDto } from '../../application/dto/create-session.dto';
import { GetSessionSeatsUseCase } from '../../application/use-cases/get-session-seats.use-case';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly getSessionSeatsUseCase: GetSessionSeatsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateSessionDto) {
    return this.createSessionUseCase.execute(body);
  }

  @Get(':id/seats')
  async getSeats(@Param('id') id: string) {
    return this.getSessionSeatsUseCase.execute(id);
  }
}
