import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { CreateSessionDto } from '../../application/dto/create-session.dto';
import { GetSessionSeatsUseCase } from '../../application/use-cases/get-session-seats.use-case';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly getSessionSeatsUseCase: GetSessionSeatsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar uma nova sessão de cinema',
    description:
      'Cria uma nova sessão com data, horário e quantidade de assentos',
  })
  @ApiCreatedResponse({
    description: 'Sessão criada com sucesso',
    schema: {
      example: {
        id: 'session-123',
        date: '2026-02-17',
        startTime: '19:00',
        endTime: '21:00',
        totalSeats: 100,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  async create(@Body() body: CreateSessionDto) {
    return this.createSessionUseCase.execute(body);
  }

  @Get(':id/seats')
  @ApiOperation({
    summary: 'Consultar disponibilidade de assentos',
    description:
      'Retorna o número de assentos disponíveis, reservados e expirados de uma sessão',
  })
  @ApiOkResponse({
    description: 'Informações de assentos retornadas com sucesso',
    schema: {
      example: {
        available: 85,
        reserved: 10,
        expired: 5,
      },
    },
  })
  async getSeats(@Param('id') id: string) {
    return this.getSessionSeatsUseCase.execute(id);
  }
}
