import { Module } from '@nestjs/common';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CharacterSheetRuntimeService } from './character-sheet-runtime.service';

@Module({
	imports: [PrismaModule, GameEventsModule],
	providers: [CharacterSheetRuntimeService],
	exports: [CharacterSheetRuntimeService]
})
export class CharacterSheetRuntimeModule {}
