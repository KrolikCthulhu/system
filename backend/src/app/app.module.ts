import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { authConfig } from './auth/config/auth.config';
import { CharacterSheetSandboxModule } from './character-sheet-sandbox/character-sheet-sandbox.module';
import { ConditionsModule } from './conditions/conditions.module';
import { DamageTypesModule } from './damage-types/damage-types.module';
import { GameEventsModule } from './game-events/game-events.module';
import { MagicModule } from './magic/magic.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressionPresetsModule } from './progression-presets/progression-presets.module';
import { RollConsequencesModule } from './roll-consequences/roll-consequences.module';
import { SkillsModule } from './skills/skills.module';
import { SpellMechanicsModule } from './spell-mechanics/spell-mechanics.module';
import { ValuesModule } from './values/values.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
		CharacterSheetSandboxModule,
		ConditionsModule,
		DamageTypesModule,
		GameEventsModule,
		MagicModule,
		ProgressionPresetsModule,
		RollConsequencesModule,
		SkillsModule,
		SpellMechanicsModule,
		ValuesModule
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	]
})
export class AppModule {}
