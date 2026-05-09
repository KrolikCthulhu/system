import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const config = app.get(ConfigService);

	app.enableCors({
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN')
	});

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

bootstrap();
