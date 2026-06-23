import { Module } from '@nestjs/common';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CharacterSheetSandboxController } from './character-sheet-sandbox.controller';
import { CharacterSheetSandboxService } from './character-sheet-sandbox.service';

@Module({
	imports: [PrismaModule, GameEventsModule],
	controllers: [CharacterSheetSandboxController],
	providers: [CharacterSheetSandboxService]
})
export class CharacterSheetSandboxModule {}
