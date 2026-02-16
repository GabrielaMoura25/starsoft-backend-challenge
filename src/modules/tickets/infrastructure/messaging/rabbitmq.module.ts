// infrastructure/messaging/rabbitmq.module.ts
import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';

@Module({
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMQModule {}
