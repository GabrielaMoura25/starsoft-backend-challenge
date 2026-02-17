// infrastructure/messaging/rabbitmq.module.ts
import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { ReservationEventConsumer } from './reservation-event.consumer';
import { SeatEventConsumer } from './seat-event.consumer';
import { ExpireReservationsUseCase } from '../../application/use-cases/expire-reservation.use-case';

@Module({
  providers: [
    RabbitMqService,
    ReservationEventConsumer,
    SeatEventConsumer,
    ExpireReservationsUseCase,
  ],
  exports: [RabbitMqService, ExpireReservationsUseCase],
})
export class RabbitMQModule {}
