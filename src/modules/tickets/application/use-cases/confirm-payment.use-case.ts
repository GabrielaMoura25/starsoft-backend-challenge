import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RabbitMqService } from '../../infrastructure/messaging/rabbitmq.service';
import { ReservationConfirmedEvent } from '../events/reservation-confirmed.event';

@Injectable()
export class ConfirmPaymentUseCase {
  private readonly logger = new Logger(ConfirmPaymentUseCase.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit?: RabbitMqService,
  ) {}

  async execute(reservationId: string) {
    this.logger.debug(`Confirming payment for reservation ${reservationId}`);
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        this.logger.warn(`Reservation not found: ${reservationId}`);
        throw new NotFoundException('Reservation not found');
      }

      //Idempotência: se já foi confirmada
      if (reservation.status === 'CONFIRMED') {
        this.logger.debug(`Reservation ${reservationId} already confirmed`);
        return { message: 'Reservation already confirmed' };
      }

      if (reservation.status !== 'PENDING') {
        throw new ConflictException('Reservation is not pending');
      }

      if (reservation.expiresAt < new Date()) {
        this.logger.warn(
          `Reservation ${reservationId} expired at ${reservation.expiresAt.toISOString()}`,
        );
        throw new BadRequestException('Reservation expired');
      }

      // Criar venda
      const sale = await tx.sale.create({
        data: {
          userId: reservation.userId,
          sessionId: reservation.sessionId,
          seatId: reservation.seatId,
        },
      });

      this.logger.log(
        `Created sale ${sale.id} for reservation ${reservationId}`,
      );

      //Atualizar reserva
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' },
      });

      //Atualizar seat
      await tx.seat.update({
        where: { id: reservation.seatId },
        data: { status: 'SOLD' },
      });

      // Publicar evento de confirmação
      try {
        await this.rabbit?.publish(
          'reservation-confirmed',
          new ReservationConfirmedEvent(
            reservation.id,
            reservation.userId,
            reservation.seatId,
          ),
        );
        this.logger.log(`Published reservation-confirmed for ${reservationId}`);
      } catch (err) {
        this.logger.error(
          'Failed to publish reservation-confirmed',
          err as any,
        );
      }

      return { message: 'Payment confirmed successfully' };
    });
  }
}
