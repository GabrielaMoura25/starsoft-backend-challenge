import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';

@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
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
}
