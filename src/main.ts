import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Configuração do CORS
  const corsOrigins = (configService.get<string>('CORS_ORIGINS')??'').split(',').map(item => item.trim()).filter(x => x);
  const allowedOrigins = corsOrigins?.length ? corsOrigins : '*';

  console.log('DEBUG CORS - ENV VAR:', configService.get('CORS_ORIGINS')); // Ver o que chega bruto
  console.log('DEBUG CORS - PARSED:', corsOrigins); // Ver o array final

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Permite o envio de cookies e headers de autenticação,
    allowedHeaders: ['url', 'token']
  });

  app.use(json({ limit: '300mb' }));
  app.use(urlencoded({ extended: true, limit: '300mb' }));

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
