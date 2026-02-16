import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { RabbitMqService } from '../../infrastructure/messaging/rabbitmq.service';
import { ReservationCreatedEvent } from '../events/reservation-created.event';
import { RedisLockService } from '../../infrastructure/cache/redis-lock.service';

@Injectable()
export class CreateReservationUseCase {
  private readonly logger = new Logger(CreateReservationUseCase.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit: RabbitMqService,
    private readonly redisLock: RedisLockService,
  ) {}

  async execute(data: CreateReservationDto) {
    this.logger.debug(`Creating reservation: ${JSON.stringify(data)}`);

    const lockKey = `seat:${data.seatId}`;
    const token = await this.redisLock.acquire(lockKey, 5000, 100, 5);
    if (!token) {
      this.logger.warn(`Could not acquire lock for seat ${data.seatId}`);
      throw new ConflictException('Seat is locked, try again');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar o assento com lock
        const seat = await tx.$queryRawUnsafe<{ id: string; status: string }[]>(
          `SELECT * FROM "Seat" WHERE id = $1 FOR UPDATE`,
          data.seatId,
        );

        if (!seat.length) {
          this.logger.warn(`Seat not found: ${data.seatId}`);
          throw new NotFoundException('Seat not found');
        }

        if (seat[0].status !== 'AVAILABLE') {
          this.logger.warn(
            `Seat not available ${data.seatId} status=${seat[0].status}`,
          );
          throw new ConflictException('Seat is not available');
        }

        // Atualizar status do assento
        await tx.seat.update({
          where: { id: data.seatId },
          data: { status: 'RESERVED' },
        });

        this.logger.log(`Seat ${data.seatId} reserved for user ${data.userId}`);

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

        try {
          await this.rabbit.publish(
            'reservation-created',
            new ReservationCreatedEvent(
              reservation.id,
              data.userId,
              data.seatId,
            ),
          );
          this.logger.log(
            `Published reservation-created for ${reservation.id}`,
          );
        } catch (err) {
          this.logger.error(
            'Failed to publish reservation-created',
            err as any,
          );
        }
        return reservation;
      });
    } finally {
      await this.redisLock.release(lockKey, token).catch(() => null);
    }
  }
}
