import { RollEventGraphDefinition } from './roll-event-graph.models';

export interface RollConsequenceValue {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

export interface RollConsequence {
	id: string;
	name: string;
	description: string;
	rollEventGraph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	values: RollConsequenceValue[];
}

export interface RollConsequencesCatalog {
	consequences: RollConsequence[];
}
