import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';
import { GetUserPurchasesUseCase } from '../../application/use-cases/get-user-purchases.use-case';

@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly getUserPurchasesUseCase: GetUserPurchasesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateReservationDto) {
    const reservation = await this.createReservationUseCase.execute(body);

    return {
      id: reservation.id,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
    };
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.confirmPaymentUseCase.execute(id);
  }

  @Get('users/:userId/purchases')
  async getUserPurchases(@Param('userId') userId: string) {
    return this.getUserPurchasesUseCase.execute(userId);
  }
}
