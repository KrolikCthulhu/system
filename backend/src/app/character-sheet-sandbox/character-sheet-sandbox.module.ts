import { Module } from '@nestjs/common';
import { CharacterSheetRuntimeModule } from '../character-sheet/character-sheet-runtime.module';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CharacterSheetSandboxController } from './character-sheet-sandbox.controller';
import { CharacterSheetSandboxService } from './character-sheet-sandbox.service';

@Module({
	imports: [PrismaModule, GameEventsModule, CharacterSheetRuntimeModule],
	controllers: [CharacterSheetSandboxController],
	providers: [CharacterSheetSandboxService]
})
export class CharacterSheetSandboxModule {}
