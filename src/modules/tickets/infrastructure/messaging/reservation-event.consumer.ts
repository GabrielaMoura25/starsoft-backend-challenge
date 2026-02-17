import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import type { ConsumeMessage, Channel } from 'amqplib';
import { RabbitMqService } from './rabbitmq.service';
import { ExpireReservationsUseCase } from '../../application/use-cases/expire-reservation.use-case';

@Injectable()
export class ReservationEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(ReservationEventConsumer.name);

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly expireReservationsUseCase: ExpireReservationsUseCase,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting reservation event consumer');
    await this.consumeReservationCreated();
  }

  private async consumeReservationCreated() {
    const queue = 'reservation-created';

    try {
      this.logger.log(`Setting up consumer for queue: ${queue}`);

      const channel: Channel = await this.rabbit.waitForConsumerChannel();

      await channel.assertQueue(queue, { durable: true });
      await channel.prefetch(1);

      await channel.consume(
        queue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const event = JSON.parse(msg.content.toString()) as {
              reservationId: string;
              userId?: string;
              seatId?: string;
            };

            this.logger.log(
              `Received reservation-created: ${event.reservationId}`,
            );

            // agenda checagem após 30s
            setTimeout(() => {
              this.logger.log(
                `Expiration check triggered for reservation ${event.reservationId}`,
              );
              this.expireReservationsUseCase.execute().catch((err) => {
                this.logger.error('Error expiring reservations', err);
              });
            }, 30_000);

            channel.ack(msg);
          } catch (err) {
            this.logger.error(
              'Error processing reservation-created',
              err as any,
            );
            channel.nack(msg, false, true);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Listening to queue: ${queue}`);
    } catch (err) {
      this.logger.error(`Error setting up consumer for ${queue}`, err as any);
      throw err;
    }
  }
}
