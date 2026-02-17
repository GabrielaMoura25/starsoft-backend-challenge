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
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      throw new Error('RABBITMQ_URL environment variable is not defined');
    }
    const maxRetries = 5;
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        this.logger.log(
          `Connecting to RabbitMQ at ${url} (attempt ${retries + 1}/${maxRetries})`,
        );
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        this.logger.log(`Connected to RabbitMQ successfully`);
        return;
      } catch (err) {
        lastError = err as Error;
        retries++;
        if (retries < maxRetries) {
          const delayMs = Math.pow(2, retries - 1) * 1000; // Exponential backoff: 1s, 2s, 4s, 8s
          this.logger.warn(
            `Failed to connect to RabbitMQ: ${(err as any).message}. Retrying in ${delayMs}ms...`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    this.logger.error(
      `Failed to connect to RabbitMQ after ${maxRetries} attempts`,
      lastError,
    );
    throw new Error(
      `Could not connect to RabbitMQ after ${maxRetries} attempts: ${lastError?.message}`,
    );
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
