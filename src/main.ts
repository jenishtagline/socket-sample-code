import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from "dotenv";
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true });

  app.use((req, res, next) => {
    try {
      res.removeHeader('x-powered-by');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "OPTIONS, GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, X-Requested-With, Authorization");
      next();
    } catch (e) {
      console.log('\n err : ', e);
    }
  });
  await app.listen(process.env.PORT || 3000, function () {
    console.log('process.env.PORT :>> ', process.env.PORT);
    console.log("Express server listening on port %d in mode", this.address().port);
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
}
bootstrap();
