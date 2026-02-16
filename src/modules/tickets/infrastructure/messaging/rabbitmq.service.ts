import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import type { Channel, ChannelModel } from 'amqplib';
import amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log(`Connected to RabbitMQ at ${url}`);
  }

  async publish(queue: string, message: unknown) {
    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      this.logger.debug(`Published message to ${queue}`);
    } catch (err) {
      this.logger.error(`Failed to publish message to ${queue}`, err as any);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel.close();
      await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (err) {
      this.logger.error('Error closing RabbitMQ connection', err as any);
    }
  }
}
