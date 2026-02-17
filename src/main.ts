import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Cinema Ticket System API')
    .setDescription(
      'API para sistema de reserva de ingressos de cinema com controle de concorrência',
    )
    .setVersion('1.0.0')
    .addTag('Sessions', 'Gerenciar sessões de cinema')
    .addTag('Reservations', 'Gerenciar reservas de assentos')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
