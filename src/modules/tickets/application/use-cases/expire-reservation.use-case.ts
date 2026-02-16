import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RabbitMqService } from '../../infrastructure/messaging/rabbitmq.service';
import { ReservationExpiredEvent } from '../events/reservation-expired.event';
import { SeatReleasedEvent } from '../events/seat-released.event';

@Injectable()
export class ExpireReservationsUseCase {
  private readonly logger = new Logger(ExpireReservationsUseCase.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit?: RabbitMqService,
  ) {}

  async execute(): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const expiredReservations = await tx.reservation.findMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lte: now,
          },
        },
      });

      this.logger.debug(
        `Found ${expiredReservations.length} expired reservations`,
      );

      for (const reservation of expiredReservations) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        this.logger.log(`Expired reservation ${reservation.id}`);

        await tx.seat.update({
          where: { id: reservation.seatId },
          data: { status: 'AVAILABLE' },
        });

        try {
          await this.rabbit?.publish(
            'reservation-expired',
            new ReservationExpiredEvent(
              reservation.id,
              reservation.userId,
              reservation.seatId,
            ),
          );
          this.logger.debug(
            `Published reservation-expired for ${reservation.id}`,
          );

          await this.rabbit?.publish(
            'seat-released',
            new SeatReleasedEvent(reservation.seatId, reservation.sessionId),
          );
          this.logger.debug(
            `Published seat-released for seat ${reservation.seatId}`,
          );
        } catch (err) {
          this.logger.error(
            'Failed to publish expiration/release events',
            err as any,
          );
        }
      }
    });
  }
}
