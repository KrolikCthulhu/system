import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	const config = app.get(ConfigService);

	app.set('trust proxy', 1);
	app.use(cookieParser());
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			transformOptions: {
				enableImplicitConversion: true
			}
		})
	);
	app.enableCors({
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
		credentials: true
	});

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

bootstrap();
