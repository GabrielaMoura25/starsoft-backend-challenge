import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      //Idempotência: se já foi confirmada
      if (reservation.status === 'CONFIRMED') {
        return { message: 'Reservation already confirmed' };
      }

      if (reservation.status !== 'PENDING') {
        throw new ConflictException('Reservation is not pending');
      }

      if (reservation.expiresAt < new Date()) {
        throw new BadRequestException('Reservation expired');
      }

      // Criar venda
      await tx.sale.create({
        data: {
          userId: reservation.userId,
          sessionId: reservation.sessionId,
          seatId: reservation.seatId,
        },
      });

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

      return { message: 'Payment confirmed successfully' };
    });
  }
}
