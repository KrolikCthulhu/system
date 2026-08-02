import { CampaignMemberRole } from './domain/combat-encounter.types';
import { RuntimeAction } from './domain/combat-encounter-runtime.types';
import type {
	CombatEncounterParticipantReadModel,
	CombatEncounterReadModel
} from './application/combat-encounter.read-model';

export type CombatAvailableActionKind = RuntimeAction['kind'] | 'system';

export type CombatAvailableActionSourceType =
	| 'creature'
	| 'condition'
	| 'system';

export type CombatActionTargetMode =
	| 'self'
	| 'selected_target'
	| 'linked_condition_target'
	| 'none';

export interface CombatAvailableActionOption {
	id: string;
	actionSlug: string;
	label: string;
	kind: CombatAvailableActionKind;
	sourceType: CombatAvailableActionSourceType;
	sourceName: string;
	sourceSlug: string | null;
	profileName: string;
	targetMode: CombatActionTargetMode;
	requiresTarget: boolean;
	costText: string;
	rangeText: string;
	description: string;
	targetChoiceLabel: string | null;
	confirmationTitle: string | null;
	optionLabelTemplate: string | null;
	costLabelTemplate: string | null;
	sortOrder: number;
	isAvailable: boolean;
	disabledReason: string | null;
	disabledReasons: string[];
	availableTargets: CombatAvailableActionTarget[];
}

export interface CombatAvailableActionTarget {
	participantId: string;
	label: string;
	potentialCost: number | null;
	costText: string;
	isAvailable: boolean;
	disabledReason: string | null;
	disabledReasons: string[];
}

export interface CombatAvailableActionGroup {
	id: string;
	kind: CombatAvailableActionKind;
	sourceName: string;
	profileName: string;
	rangeText: string;
	costText: string;
	actions: CombatAvailableActionOption[];
}

export interface CombatAvailableActions {
	attacks: CombatAvailableActionGroup[];
	abilities: CombatAvailableActionOption[];
	contextualActions: CombatAvailableActionOption[];
	systemActions: CombatAvailableActionOption[];
}

export interface CombatActionProviderContext {
	encounter: CombatEncounterReadModel;
	participant: CombatEncounterParticipantReadModel;
	currentUserRole: CampaignMemberRole;
	currentUserId: string;
}

export interface CombatActionDefinition {
	action: RuntimeAction;
	sourceType: CombatAvailableActionSourceType;
}

export interface CombatActionProvider {
	collect(
		context: CombatActionProviderContext
	): Promise<CombatActionDefinition[]>;
}
