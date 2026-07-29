import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CharacterSheetRuntimeModule } from '../character-sheet/character-sheet-runtime.module';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CombatActionCheckRuntimeService } from './combat-action-check-runtime.service';
import { CombatEncounterRealtimeService } from './combat-encounter-realtime.service';
import { CombatEncountersController } from './combat-encounters.controller';
import { CombatEncountersGateway } from './combat-encounters.gateway';
import { CombatEncountersService } from './combat-encounters.service';

@Module({
	imports: [PrismaModule, GameEventsModule, AuthModule, CharacterSheetRuntimeModule],
	controllers: [CombatEncountersController],
	providers: [
		CombatActionCheckRuntimeService,
		CombatEncountersService,
		CombatEncountersGateway,
		CombatEncounterRealtimeService
	]
})
export class CombatEncountersModule {}
