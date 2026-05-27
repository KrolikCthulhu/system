import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { authConfig } from './auth/config/auth.config';
import { PrismaModule } from './prisma/prisma.module';
import { SkillsModule } from './skills/skills.module';
import { ValuesModule } from './values/values.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [authConfig],
			expandVariables: true,
			isGlobal: true
			//   ignoreEnvFile: !IS_DEV_ENV,
		}),
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule.forFeature(authConfig)],
			inject: [authConfig.KEY],
			useFactory: (settings: ConfigType<typeof authConfig>) => [
				{
					name: 'default',
					ttl: settings.throttleDefaultTtlMs,
					limit: settings.throttleDefaultLimit
				}
			]
		}),
		ScheduleModule.forRoot(),
		PrismaModule,
		AuthModule,
		AttributesModule,
		SkillsModule,
		ValuesModule
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	]
})
export class AppModule {}
