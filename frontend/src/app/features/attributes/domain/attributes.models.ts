import { SystemValueCalculationDefinition } from '../../values/domain/system-value-calculation.models';

export interface Attribute {
	id: string;
	name: string;
	description: string;
	poolPenaltyValueId: string | null;
	availablePoolValueId: string | null;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	systemValue: SystemValueCalculationDefinition;
}

export interface Characteristic {
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
	systemValue: SystemValueCalculationDefinition;
}

export interface AttributesAdminCatalog {
	attributes: Attribute[];
	characteristics: Characteristic[];
}
