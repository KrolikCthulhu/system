import { ValueGraphState } from '../ui/value-graph.models';

export interface SystemValueCalculationDefinition {
	id: string;
	calculationGraph: ValueGraphState | null;
}
