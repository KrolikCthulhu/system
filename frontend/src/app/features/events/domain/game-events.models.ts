import { RollConsequence } from '../../roll-consequences/domain/roll-consequences.models';
import { RollEventGraphDefinition } from '../../roll-consequences/domain/roll-event-graph.models';

export interface GameEventHandler {
	id: string;
	eventType: string;
	name: string;
	description: string;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
}

export interface GlobalEventHandlerItem {
	key: string;
	id: string;
	type: 'global';
	name: string;
	description: string;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	subtitle: string;
	source: GameEventHandler;
}

export interface ConsequenceEventHandlerItem {
	key: string;
	id: string;
	type: 'consequence';
	name: string;
	description: string;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	subtitle: string;
	source: RollConsequence;
}

export type EventHandlerItem = GlobalEventHandlerItem | ConsequenceEventHandlerItem;

export interface RollPerformedHandlersCatalog {
	globalHandlers: GameEventHandler[];
	consequences: RollConsequence[];
}

export function createGlobalHandlerItem(
	handler: GameEventHandler
): GlobalEventHandlerItem {
	return {
		key: `global:${handler.id}`,
		id: handler.id,
		type: 'global',
		name: handler.name,
		description: handler.description,
		graph: handler.graph,
		isActive: handler.isActive,
		sortOrder: handler.sortOrder,
		subtitle: 'Глобальный обработчик',
		source: handler
	};
}

export function createConsequenceHandlerItem(
	consequence: RollConsequence
): ConsequenceEventHandlerItem {
	return {
		key: `consequence:${consequence.id}`,
		id: consequence.id,
		type: 'consequence',
		name: consequence.name,
		description: consequence.description,
		graph: consequence.rollEventGraph,
		isActive: consequence.isActive,
		sortOrder: consequence.sortOrder,
		subtitle: 'Последствие броска',
		source: consequence
	};
}
