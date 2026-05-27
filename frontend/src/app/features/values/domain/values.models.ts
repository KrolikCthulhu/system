import {
	SystemValueBaseSourceType,
	SystemValueSourceType
} from '../../../shared/types/system-value.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface SystemValue {
	id: string;
	name: string;
	kind: SystemValueSourceType;
	groupLabel: string;
	contextLabel: string;
	description: string;
	isSystemValue: boolean;
	baseSourceType: SystemValueBaseSourceType;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
}

export interface SystemValuesCatalog {
	values: SystemValue[];
}
