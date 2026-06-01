import { SystemValueBaseSourceType } from '../../../shared/types/system-value.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface SystemValueCalculationDefinition {
	id: string;
	baseSourceType: SystemValueBaseSourceType;
	calculationGraph: ValueGraphState | null;
}
