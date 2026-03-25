import "./instrument";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });



  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173", "https://sellify-pi.vercel.app"], // frontend URL 
    credentials: true
  });


  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
