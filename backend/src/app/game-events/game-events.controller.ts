import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UpdateGameEventHandlerDto } from './dto/update-game-event-handler.dto';
import { GameEventHandlersService } from './game-event-handlers.service';

@Controller('admin/game-events')
export class GameEventsController {
	constructor(private readonly handlers: GameEventHandlersService) {}

	@Get('roll-performed/handlers')
	getRollPerformedHandlers() {
		return this.handlers.getRollPerformedHandlers();
	}

	@Patch('handlers/:id')
	updateHandler(
		@Param('id') id: string,
		@Body() dto: UpdateGameEventHandlerDto
	) {
		return this.handlers.update(id, dto);
	}
}
