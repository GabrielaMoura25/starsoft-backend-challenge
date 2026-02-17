import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import type { Channel, ChannelModel, ConfirmChannel, Options } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);

  private connection?: ChannelModel;
  private pubChannel?: ConfirmChannel; // confirm channel para publish
  private subChannel?: Channel; // channel normal para consume

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      throw new Error('RABBITMQ_URL environment variable is not defined');
    }

    const maxRetries = 5;
    let retries = 0;
    let lastError: unknown = null;

    while (retries < maxRetries) {
      try {
        this.logger.log(
          `Connecting to RabbitMQ at ${url} (attempt ${retries + 1}/${maxRetries})`,
        );

        this.connection = await amqp.connect(url);

        // Channel para publicar com confirmação do broker
        this.pubChannel = await this.connection.createConfirmChannel();

        // Channel separado para consumir
        this.subChannel = await this.connection.createChannel();

        this.logger.log(
          `Connected to RabbitMQ successfully (pub=confirm, sub=normal)`,
        );
        return;
      } catch (err) {
        lastError = err;
        retries++;

        if (retries < maxRetries) {
          const delayMs = Math.pow(2, retries - 1) * 1000; // 1s, 2s, 4s, 8s
          this.logger.warn(
            `Failed to connect to RabbitMQ: ${(err as any)?.message}. Retrying in ${delayMs}ms...`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    this.logger.error(
      `Failed to connect to RabbitMQ after ${maxRetries} attempts`,
      lastError as any,
    );
    throw new Error(
      `Could not connect to RabbitMQ after ${maxRetries} attempts: ${(lastError as any)?.message}`,
    );
  }

  /**
   * Publica com confirmação do broker (ConfirmChannel).
   * Só resolve a Promise quando o RabbitMQ confirma o publish.
   */
  async publish(
    queue: string,
    message: unknown,
    options?: Options.Publish,
  ): Promise<void> {
    if (!this.pubChannel) {
      throw new Error('RabbitMQ publish channel is not connected');
    }

    await this.pubChannel.assertQueue(queue, { durable: true });

    const payload = Buffer.from(JSON.stringify(message));

    await new Promise<void>((resolve, reject) => {
      this.pubChannel!.sendToQueue(
        queue,
        payload,
        { persistent: true, ...options },
        (err) => {
          if (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            return reject(error);
          }
          return resolve();
        },
      );
    });

    this.logger.log(`Message CONFIRMED by broker -> queue: ${queue}`);
  }

  /**
   * Aguarda o channel de consumo estar pronto (evita undefined no startup).
   */
  async waitForConsumerChannel(): Promise<Channel> {
    const maxRetries = 200; // 20s (200 * 100ms)
    for (let i = 0; i < maxRetries; i++) {
      if (this.subChannel) return this.subChannel;
      await new Promise((r) => setTimeout(r, 100));
    }

    this.logger.error('RabbitMQ consumer channel is not available');
    throw new Error('RabbitMQ consumer channel is not available');
  }

  async onModuleDestroy() {
    try {
      await this.subChannel?.close().catch(() => null);
      await this.pubChannel?.close().catch(() => null);
      await this.connection?.close().catch(() => null);
      this.logger.log('RabbitMQ connection closed');
    } catch (err) {
      this.logger.error('Error closing RabbitMQ connection', err as any);
    }
  }
}
