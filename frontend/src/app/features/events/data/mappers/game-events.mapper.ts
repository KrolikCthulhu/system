import { GameEventHandler } from '../../domain/game-events.models';
import { GameEventHandlerDto } from '../dto/game-events.dto';

export function mapGameEventHandlerDto(
	dto: GameEventHandlerDto
): GameEventHandler {
	return {
		id: dto.id,
		eventType: dto.eventType,
		name: dto.name,
		description: dto.description ?? '',
		graph: dto.graph,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder
	};
}
