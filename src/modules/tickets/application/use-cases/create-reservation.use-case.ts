import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';

@Injectable()
export class CreateReservationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateReservationDto) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar o assento com lock
      const seat = await tx.$queryRawUnsafe<{ id: string; status: string }[]>(
        `SELECT * FROM "Seat" WHERE id = $1 FOR UPDATE`,
        data.seatId,
      );

      if (!seat.length) {
        throw new NotFoundException('Seat not found');
      }

      if (seat[0].status !== 'AVAILABLE') {
        throw new ConflictException('Seat is not available');
      }

      // Atualizar status do assento
      await tx.seat.update({
        where: { id: data.seatId },
        data: { status: 'RESERVED' },
      });

      // Criar reserva temporária (30s)
      const expiresAt = new Date(Date.now() + 30 * 1000);

      const reservation = await tx.reservation.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          seatId: data.seatId,
          expiresAt,
        },
      });
      return reservation;
    });
  }
}
