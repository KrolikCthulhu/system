import {
	SystemValueBaseSourceType,
	SystemValueSourceType
} from '../../../shared/types/system-value.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface SystemValueCalculationDefinition {
	id: string;
	isSystemValue: boolean;
	sourceType: SystemValueSourceType;
	baseSourceType: SystemValueBaseSourceType;
	calculationGraph: ValueGraphState | null;
}
