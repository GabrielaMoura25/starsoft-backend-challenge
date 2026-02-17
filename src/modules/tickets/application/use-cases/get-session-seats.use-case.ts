import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class GetSessionSeatsUseCase {
  private readonly logger = new Logger(GetSessionSeatsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(sessionId: string) {
    this.logger.debug(`Fetching seats for session: ${sessionId}`);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        seats: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      throw new NotFoundException('Session not found');
    }

    const result = {
      sessionId: session.id,
      movieTitle: session.movieTitle,
      room: session.room,
      dateTime: session.dateTime,
      price: session.price,
      seats: session.seats.map((seat) => ({
        id: seat.id,
        number: seat.number,
        status: seat.status,
      })),
      summary: {
        total: session.seats.length,
        available: session.seats.filter((s) => s.status === 'AVAILABLE').length,
        reserved: session.seats.filter((s) => s.status === 'RESERVED').length,
        sold: session.seats.filter((s) => s.status === 'SOLD').length,
      },
    };

    this.logger.log(
      `Session seats fetched successfully: sessionId=${sessionId}, available=${result.summary.available}`,
    );

    return result;
  }
}
