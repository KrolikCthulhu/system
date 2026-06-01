import { ValueGraphState } from '../../ui/value-graph.models';

export type SystemValueKindDto =
	| 'skill'
	| 'attribute'
	| 'characteristic'
	| 'roll-consequence'
	| 'manual';
export type SystemValueBaseSourceTypeDto = 'CHARACTER_INPUT' | 'COMPUTED';

export interface SystemValueOwnerDto {
	type: SystemValueKindDto;
	id: string | null;
}

export interface SystemValueLinkDto {
	targetType: SystemValueKindDto;
	targetId: string | null;
	label: string;
	sortOrder: number;
}

export interface SystemValueDto {
	id: string;
	name: string;
	kind: SystemValueKindDto;
	groupLabel: string;
	contextLabel: string;
	description: string;
	baseSourceType: SystemValueBaseSourceTypeDto;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
	primaryOwner: SystemValueOwnerDto;
	links: SystemValueLinkDto[];
}

export interface SystemValuesCatalogDto {
	values: SystemValueDto[];
}

export interface UpdateSystemValueCalculationDto {
	baseSourceType: SystemValueBaseSourceTypeDto;
	calculationGraph: ValueGraphState | null;
}
