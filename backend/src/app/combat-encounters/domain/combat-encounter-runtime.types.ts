import {
	CombatActionDefenseConfig,
	CombatActionRollConfig
} from './combat-action-check.types';
import { JsonObject } from './json.types';

export interface RuntimeActionReference {
	name: string;
	slug: string;
}

export interface RuntimeActionSource {
	type: string;
	name: string;
	slug: string;
	profileName: string;
	intent: RuntimeActionReference | null;
}

export interface RuntimeActionEffect {
	type: string;
	value?: number | null;
	damageMode?:
		| 'clean_successes'
		| 'clean_successes_plus_base'
		| 'base_damage'
		| null;
	damageType?: RuntimeActionReference | null;
	condition?: RuntimeActionReference | null;
	linkedCondition?: RuntimeActionReference | null;
	conditionDisplayName?: string | null;
	conditionLevel?: number | null;
	targetScope?: string | null;
	requiresDamageAfterArmor?: boolean;
	text?: string | null;
	sortOrder?: number | null;
}

export interface RuntimeActionRoll extends CombatActionRollConfig {}

export interface RuntimeActionDefense extends CombatActionDefenseConfig {}

export interface RuntimeAction {
	slug: string;
	name: string;
	kind: string;
	source?: RuntimeActionSource | null;
	cost?: {
		mode?: string;
		potential?: number | null;
	};
	target?: {
		type?: string;
	};
	roll?: RuntimeActionRoll | null;
	defense?: RuntimeActionDefense | null;
	effects?: RuntimeActionEffect[];
	isActive?: boolean;
	sortOrder?: number | null;
}

export interface AppliedRuntimeState {
	lastDamageAfterArmor: number;
	conditionInstances: Map<string, string>;
	linkedTargetParticipantId: string | null;
	events: JsonObject[];
}
