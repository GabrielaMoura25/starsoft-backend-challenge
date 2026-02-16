import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Channel, ChannelModel } from 'amqplib';
import amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection!: ChannelModel;
  private channel!: Channel;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
  }

  async publish(queue: string, message: unknown) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }
}
