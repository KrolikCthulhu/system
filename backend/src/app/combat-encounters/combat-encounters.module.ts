import { Module } from '@nestjs/common';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CombatEncountersController } from './combat-encounters.controller';
import { CombatEncountersService } from './combat-encounters.service';

@Module({
	imports: [PrismaModule, GameEventsModule],
	controllers: [CombatEncountersController],
	providers: [CombatEncountersService]
})
export class CombatEncountersModule {}
