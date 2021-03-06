// import * as cookieParser from 'cookie-parser';
// import * as csurf from 'csurf';
// import * as session from 'express-session';

import { DbExceptionFilter, HttpExceptionFilter } from '@common/exceptions';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.APP_ROUTE_PREFIX;
  const port = +process.env.APP_PORT || 3001;
  const host = process.env.APP_HOST || 'localhost';
  const protocol = process.env.APP_PROTOCOL || 'http';
  const url = `${protocol}://${host}:${port}/${prefix}`;

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.use(helmet());

  app.use(compression());

  app.use(
    rateLimit({
      windowMs: +process.env.RATE_LIMIT_TIME,
      max: +process.env.RATE_LIMIT_MAX,
    }),
  );

  // Secure
  // app.use(cookieParser());
  // app.use(
  //   session({
  //     secret: process.env.SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //   }),
  // );
  // app.use(csurf());

  app.setGlobalPrefix(prefix);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new DbExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());
  // app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Dependency injection for class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app
    .listen(port)
    .then(() => console.warn(`WELCOME, YOUR API IS READY ON URL: ${url}`))
    .catch((err) => console.error(err, 'Application is crashed'));
}

bootstrap();
