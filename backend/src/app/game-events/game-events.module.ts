import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GameEventDispatcherService } from './game-event-dispatcher.service';
import { GameEventHandlersService } from './game-event-handlers.service';
import { GameEventsController } from './game-events.controller';
import { RollEventGraphRuntimeService } from './roll-event-graph-runtime.service';
import { SystemValueRuntimeService } from './system-value-runtime.service';

@Module({
	imports: [PrismaModule],
	controllers: [GameEventsController],
	providers: [
		GameEventDispatcherService,
		GameEventHandlersService,
		RollEventGraphRuntimeService,
		SystemValueRuntimeService
	],
	exports: [
		GameEventDispatcherService,
		GameEventHandlersService,
		SystemValueRuntimeService
	]
})
export class GameEventsModule {}
