import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnatomySchemesModule } from './anatomy-schemes/anatomy-schemes.module';
import { ArmorPresetsModule } from './armor-presets/armor-presets.module';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { authConfig } from './auth/config/auth.config';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CharacterSheetSandboxModule } from './character-sheet-sandbox/character-sheet-sandbox.module';
import { CombatEncountersModule } from './combat-encounters/combat-encounters.module';
import { CombatIntentsModule } from './combat-intents/combat-intents.module';
import { ConditionsModule } from './conditions/conditions.module';
import { CreatureTypesModule } from './creature-types/creature-types.module';
import { CreaturesModule } from './creatures/creatures.module';
import { DamageTypesModule } from './damage-types/damage-types.module';
import { GameEventsModule } from './game-events/game-events.module';
import { MagicModule } from './magic/magic.module';
import { PlayerCharactersModule } from './player-characters/player-characters.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressionPresetsModule } from './progression-presets/progression-presets.module';
import { RollConsequencesModule } from './roll-consequences/roll-consequences.module';
import { SkillsModule } from './skills/skills.module';
import { SpellMechanicsModule } from './spell-mechanics/spell-mechanics.module';
import { SystemCombatActionsModule } from './system-combat-actions/system-combat-actions.module';
import { ValuesModule } from './values/values.module';
import { WeaponsModule } from './weapons/weapons.module';
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
		AnatomySchemesModule,
		ArmorPresetsModule,
		AuthModule,
		AttributesModule,
		CampaignsModule,
		CharacterSheetSandboxModule,
		CombatEncountersModule,
		CombatIntentsModule,
		ConditionsModule,
		CreatureTypesModule,
		CreaturesModule,
		DamageTypesModule,
		GameEventsModule,
		MagicModule,
		PlayerCharactersModule,
		ProgressionPresetsModule,
		RollConsequencesModule,
		SkillsModule,
		SpellMechanicsModule,
		SystemCombatActionsModule,
		ValuesModule,
		WeaponsModule
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
