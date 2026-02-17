import { Module } from '@nestjs/common';
import { ReservationController } from './presentation/controllers/reservation.controller';
import { PrismaService } from './infrastructure/database/prisma.service';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { SessionController } from './presentation/controllers/session.controller';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { GetSessionSeatsUseCase } from './application/use-cases/get-session-seats.use-case';
import { GetUserPurchasesUseCase } from './application/use-cases/get-user-purchases.use-case';
import { RabbitMQModule } from './infrastructure/messaging/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  controllers: [ReservationController, SessionController],
  providers: [
    PrismaService,
    CreateReservationUseCase,
    CreateSessionUseCase,
    ConfirmPaymentUseCase,
    GetSessionSeatsUseCase,
    GetUserPurchasesUseCase,
  ],
})
export class TicketsModule {}
