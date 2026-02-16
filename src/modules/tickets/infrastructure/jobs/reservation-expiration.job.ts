import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpireReservationsUseCase } from '../../application/use-cases/expire-reservation.use-case';

@Injectable()
export class ReservationExpirationJob {
  constructor(
    private readonly expireReservationsUseCase: ExpireReservationsUseCase,
  ) {}

  @Cron('*/5 * * * * *')
  async handle() {
    await this.expireReservationsUseCase.execute();
  }
}
