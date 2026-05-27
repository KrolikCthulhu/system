import { SystemValueDefinition } from '../../../shared/types/system-value.models';

export interface Attribute {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	systemValue: SystemValueDefinition;
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
	systemValue: SystemValueDefinition;
}

export interface AttributesAdminCatalog {
	attributes: Attribute[];
	characteristics: Characteristic[];
}
