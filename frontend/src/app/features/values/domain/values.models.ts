import {
	SystemValueBaseSourceType,
	SystemValueSourceType
} from '../../../shared/types/system-value.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface SystemValueOwner {
	type: SystemValueSourceType;
	id: string | null;
}

export interface SystemValueLink {
	targetType: SystemValueSourceType;
	targetId: string | null;
	label: string;
	sortOrder: number;
}

export interface SystemValue {
	id: string;
	name: string;
	kind: SystemValueSourceType;
	groupLabel: string;
	contextLabel: string;
	description: string;
	baseSourceType: SystemValueBaseSourceType;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
	primaryOwner: SystemValueOwner;
	links: SystemValueLink[];
}

export interface SystemValuesCatalog {
	values: SystemValue[];
}
