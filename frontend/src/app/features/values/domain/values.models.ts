import { SystemValueSourceType } from '../../../shared/types/system-value.models';
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
	slug: string;
	name: string;
	kind: SystemValueSourceType;
	groupLabel: string;
	displaySection: string;
	contextLabel: string;
	description: string;
	isSystemManaged: boolean;
	baseValue: number;
	calculationGraph: ValueGraphState | null;
	primaryOwner: SystemValueOwner;
	links: SystemValueLink[];
}

export interface SystemValuesCatalog {
	values: SystemValue[];
}
