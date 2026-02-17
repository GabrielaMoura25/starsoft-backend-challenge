import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/tickets/infrastructure/database/prisma.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RabbitMQModule } from './modules/tickets/infrastructure/messaging/rabbitmq.module';
import { RedisModule } from './modules/tickets/infrastructure/cache/redis.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições por minuto
      },
    ]),
    PrismaModule,
    TicketsModule,
    ScheduleModule.forRoot(),
    RabbitMQModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
