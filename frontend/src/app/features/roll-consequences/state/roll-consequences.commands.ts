import { RollEventGraphDefinition } from '../domain/roll-event-graph.models';

export interface RollConsequenceValueCommand {
	id?: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreateRollConsequenceCommand {
	name: string;
	description: string;
	rollEventGraph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	values: RollConsequenceValueCommand[];
}

export interface UpdateRollConsequenceCommand
	extends CreateRollConsequenceCommand {
	id: string;
}

export interface UpdateRollConsequenceActiveCommand {
	id: string;
	isActive: boolean;
}
