import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/tickets/infrastructure/database/prisma.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RabbitMQModule } from './modules/tickets/infrastructure/messaging/rabbitmq.module';
import { RedisModule } from './modules/tickets/infrastructure/cache/redis.module';

@Module({
  imports: [
    PrismaModule,
    TicketsModule,
    ScheduleModule.forRoot(),
    RabbitMQModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
