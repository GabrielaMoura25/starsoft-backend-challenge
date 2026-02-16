import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class ExpireReservationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

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

      for (const reservation of expiredReservations) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        await tx.seat.update({
          where: { id: reservation.seatId },
          data: { status: 'AVAILABLE' },
        });
      }
    });
  }
}
