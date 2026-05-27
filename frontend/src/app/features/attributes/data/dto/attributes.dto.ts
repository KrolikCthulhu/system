export type SystemValueBaseSourceTypeDto =
	| 'CHARACTER_INPUT'
	| 'COMPUTED';

export interface AttributeDto {
	id: string;
	name: string;
	description: string;
	isSystemValue: boolean;
	baseSourceType: SystemValueBaseSourceTypeDto;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CharacteristicDto {
	id: string;
	name: string;
	attributeId: string;
	description: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	isSystemValue: boolean;
	baseSourceType: SystemValueBaseSourceTypeDto;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface AttributesAdminCatalogDto {
	attributes: AttributeDto[];
	characteristics: CharacteristicDto[];
}
