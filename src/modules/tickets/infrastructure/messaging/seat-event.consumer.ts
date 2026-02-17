import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import type { ConsumeMessage, Channel } from 'amqplib';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class SeatEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(SeatEventConsumer.name);

  constructor(private readonly rabbit: RabbitMqService) {}

  async onModuleInit() {
    this.logger.log('Starting seat event consumer');
    await this.consumeSeatReleased();
  }

  private async consumeSeatReleased() {
    const queue = 'seat-released';

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
              seatId: string;
              sessionId?: string;
            };

            this.logger.log(`Received seat-released: ${event.seatId}`);

            channel.ack(msg);
          } catch (err) {
            this.logger.error('Error processing seat-released', err as any);
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
