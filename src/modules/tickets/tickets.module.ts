import { Module } from '@nestjs/common';
import { ReservationController } from './presentation/controllers/reservation.controller';
import { PrismaService } from './infrastructure/database/prisma.service';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { SessionController } from './presentation/controllers/session.controller';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';

@Module({
  controllers: [ReservationController, SessionController],
  providers: [PrismaService, CreateReservationUseCase, CreateSessionUseCase],
})
export class TicketsModule {}
