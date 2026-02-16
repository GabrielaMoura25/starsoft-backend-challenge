import { Module } from '@nestjs/common';
import { ReservationController } from './presentation/reservation.controller';
import { PrismaService } from './infrastructure/database/prisma.service';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';

@Module({
  controllers: [ReservationController],
  providers: [PrismaService, CreateReservationUseCase],
})
export class TicketsModule {}
