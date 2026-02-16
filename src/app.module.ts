import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/tickets/infrastructure/database/prisma.module';
import { TicketsModule } from './modules/tickets/tickets.module';

@Module({
  imports: [PrismaModule, TicketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
