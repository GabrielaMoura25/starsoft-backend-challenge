import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class CreateSessionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateSessionDto) {
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

      // Criar assentos automaticamente
      const seats = Array.from({ length: data.totalSeats }).map((_, index) => ({
        number: index + 1,
        sessionId: session.id,
      }));

      await tx.seat.createMany({
        data: seats,
      });

      return {
        ...session,
        totalSeats: data.totalSeats,
      };
    });
  }
}
