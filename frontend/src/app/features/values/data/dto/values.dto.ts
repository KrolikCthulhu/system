import { ValueGraphState } from '../../ui/value-graph.models';

export type SystemValueKindDto = 'skill' | 'attribute' | 'characteristic';
export type SystemValueBaseSourceTypeDto = 'CHARACTER_INPUT' | 'COMPUTED';

export interface SystemValueDto {
	id: string;
	name: string;
	kind: SystemValueKindDto;
	groupLabel: string;
	contextLabel: string;
	description: string;
	isSystemValue: boolean;
	baseSourceType: SystemValueBaseSourceTypeDto;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
}

export interface SystemValuesCatalogDto {
	values: SystemValueDto[];
}

export interface UpdateSystemValueCalculationDto {
	baseSourceType: SystemValueBaseSourceTypeDto;
	calculationGraph: ValueGraphState | null;
}
