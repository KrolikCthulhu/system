import { ValueGraphState } from '../../ui/value-graph.models';

export type SystemValueKindDto =
	| 'skill'
	| 'attribute'
	| 'characteristic'
	| 'roll-consequence'
	| 'manual';
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
	displaySection: string;
	contextLabel: string;
	description: string;
	isSystemManaged: boolean;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
	primaryOwner: SystemValueOwnerDto;
	links: SystemValueLinkDto[];
}

export interface SystemValuesCatalogDto {
	values: SystemValueDto[];
}

export interface UpdateSystemValueCalculationDto {
	calculationGraph: ValueGraphState | null;
}

export interface CreateManualSystemValueDto {
	name: string;
	description?: string;
	displaySection?: string;
}

export interface UpdateSystemValueDto {
	name?: string;
	description?: string;
	displaySection?: string;
}
