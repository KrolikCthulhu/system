import { Module } from '@nestjs/common';
import { GameEventDispatcherService } from '../game-events/game-event-dispatcher.service';
import { RollEventGraphRuntimeService } from '../game-events/roll-event-graph-runtime.service';
import { SystemValueRuntimeService } from '../game-events/system-value-runtime.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CharacterSheetSandboxController } from './character-sheet-sandbox.controller';
import { CharacterSheetSandboxService } from './character-sheet-sandbox.service';

@Module({
	imports: [PrismaModule],
	controllers: [CharacterSheetSandboxController],
	providers: [
		CharacterSheetSandboxService,
		GameEventDispatcherService,
		RollEventGraphRuntimeService,
		SystemValueRuntimeService
	]
})
export class CharacterSheetSandboxModule {}
