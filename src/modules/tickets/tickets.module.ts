import { Module } from '@nestjs/common';
import { ReservationController } from './presentation/controllers/reservation.controller';
import { PrismaService } from './infrastructure/database/prisma.service';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { SessionController } from './presentation/controllers/session.controller';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { ExpireReservationsUseCase } from './application/use-cases/expire-reservation.use-case';
import { ReservationExpirationJob } from './infrastructure/jobs/reservation-expiration.job';

@Module({
  controllers: [ReservationController, SessionController],
  providers: [
    PrismaService,
    CreateReservationUseCase,
    CreateSessionUseCase,
    ExpireReservationsUseCase,
    ReservationExpirationJob,
  ],
})
export class TicketsModule {}
