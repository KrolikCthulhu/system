import { ValueGraphState } from '../../../values/ui/value-graph.models';

export interface EntitySystemValueDto {
	id: string;
	calculationGraph: ValueGraphState | null;
}

export interface AttributeDto {
	id: string;
	name: string;
	description: string;
	poolPenaltyValueId: string | null;
	availablePoolValueId: string | null;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	systemValue: EntitySystemValueDto;
}

export interface CharacteristicDto {
	id: string;
	name: string;
	attributeId: string;
	description: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	systemValue: EntitySystemValueDto;
}

export interface AttributesAdminCatalogDto {
	attributes: AttributeDto[];
	characteristics: CharacteristicDto[];
}
