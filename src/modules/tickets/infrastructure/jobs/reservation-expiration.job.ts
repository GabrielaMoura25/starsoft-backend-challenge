import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpireReservationsUseCase } from '../../application/use-cases/expire-reservation.use-case';

@Injectable()
export class ReservationExpirationJob {
  private readonly logger = new Logger(ReservationExpirationJob.name);
  constructor(
    private readonly expireReservationsUseCase: ExpireReservationsUseCase,
  ) {}

  @Cron('*/5 * * * * *')
  async handle() {
    this.logger.debug('Running reservation expiration job');
    try {
      await this.expireReservationsUseCase.execute();
      this.logger.debug('Reservation expiration job finished');
    } catch (err) {
      this.logger.error('Reservation expiration job failed', err as any);
    }
  }
}
