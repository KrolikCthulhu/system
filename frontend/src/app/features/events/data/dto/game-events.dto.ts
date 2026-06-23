import { RollEventGraphDefinition } from '../../../roll-consequences/domain/roll-event-graph.models';

export interface GameEventHandlerDto {
	id: string;
	eventType: string;
	name: string;
	description: string | null;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
}

export interface GameEventHandlersResponseDto {
	handlers: GameEventHandlerDto[];
}
