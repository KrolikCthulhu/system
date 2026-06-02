import { RollEventGraphDefinition } from '../../domain/roll-event-graph.models';

export interface RollConsequenceValueDto {
	id: string;
	name: string;
	description: string | null;
	isActive: boolean;
	sortOrder: number;
}

export interface RollConsequenceDto {
	id: string;
	name: string;
	description: string | null;
	rollEventGraph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	values: RollConsequenceValueDto[];
}

export interface RollConsequencesCatalogDto {
	consequences: RollConsequenceDto[];
}
