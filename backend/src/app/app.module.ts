import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			expandVariables: true,
			isGlobal: true
			//   ignoreEnvFile: !IS_DEV_ENV,
		}),
		PrismaModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
