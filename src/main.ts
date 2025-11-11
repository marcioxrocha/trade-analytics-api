import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Configuração do CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  if (corsOrigins) {
    const allowedOrigins = corsOrigins.split(',').map(item => item.trim());
    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
      credentials: true, // Permite o envio de cookies e headers de autenticação
    });
  }  

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
