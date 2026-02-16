import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { CreateSessionDto } from '../../application/dto/create-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly createSessionUseCase: CreateSessionUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateSessionDto) {
    return this.createSessionUseCase.execute(body);
  }
}
