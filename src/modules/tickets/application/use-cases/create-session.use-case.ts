import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class CreateSessionUseCase {
  private readonly logger = new Logger(CreateSessionUseCase.name);
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateSessionDto) {
    this.logger.debug(
      `Creating session ${data.movieTitle} at ${data.dateTime} room ${data.room}`,
    );
    return this.prisma.$transaction(async (tx) => {
      // Criar sessão
      const session = await tx.session.create({
        data: {
          movieTitle: data.movieTitle,
          room: data.room,
          dateTime: new Date(data.dateTime),
          price: data.price,
        },
      });

      this.logger.log(`Created session ${session.id}`);

      // Criar assentos automaticamente
      const seats = Array.from({ length: data.totalSeats }).map((_, index) => ({
        number: index + 1,
        sessionId: session.id,
      }));

      await tx.seat.createMany({
        data: seats,
      });

      this.logger.log(
        `Created ${data.totalSeats} seats for session ${session.id}`,
      );
      return {
        ...session,
        totalSeats: data.totalSeats,
      };
    });
  }
}
