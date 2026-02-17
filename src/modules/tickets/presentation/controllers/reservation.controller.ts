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
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';
import { GetUserPurchasesUseCase } from '../../application/use-cases/get-user-purchases.use-case';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly getUserPurchasesUseCase: GetUserPurchasesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar uma nova reserva',
    description:
      'Reserva um assento para um usuário em uma sessão. A reserva expira em 30 segundos se não confirmada.',
  })
  @ApiCreatedResponse({
    description: 'Reserva criada com sucesso',
    schema: {
      example: {
        id: 'reservation-123',
        expiresAt: '2026-02-17T00:38:00Z',
        status: 'PENDING',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({
    description: 'Assento indisponível ou bloqueado',
  })
  async create(@Body() body: CreateReservationDto) {
    const reservation = await this.createReservationUseCase.execute(body);

    return {
      id: reservation.id,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
    };
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirmar pagamento de uma reserva',
    description:
      'Confirma o pagamento e transforma a reserva pendente em compra confirmada',
  })
  @ApiOkResponse({
    description: 'Pagamento confirmado com sucesso',
    schema: {
      example: {
        id: 'reservation-123',
        status: 'CONFIRMED',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Reserva não encontrada' })
  async confirm(@Param('id') id: string) {
    return this.confirmPaymentUseCase.execute(id);
  }

  @Get('users/:userId/purchases')
  @ApiOperation({
    summary: 'Obter histórico de compras do usuário',
    description:
      'Lista todas as compras confirmadas de um usuário com detalhes dos ingressos',
  })
  @ApiOkResponse({
    description: 'Histórico de compras retornado com sucesso',
    schema: {
      example: {
        purchases: [
          {
            id: 'reservation-123',
            sessionId: 'session-456',
            seatId: 'seat-789',
            status: 'CONFIRMED',
          },
        ],
      },
    },
  })
  async getUserPurchases(@Param('userId') userId: string) {
    return this.getUserPurchasesUseCase.execute(userId);
  }
}
