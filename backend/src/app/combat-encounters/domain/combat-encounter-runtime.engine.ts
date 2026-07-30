import {
	CombatDefenseOption,
	CombatResolvedRoll
} from './combat-action-check.types';
import {
	RuntimeAction,
	RuntimeActionDefense,
	RuntimeActionEffect,
	RuntimeActionReference,
	RuntimeActionRoll,
	RuntimeActionSource
} from './combat-encounter-runtime.types';
import { JsonValue } from './json.types';

interface RuntimeParticipantActionSource {
	creature: { actions: JsonValue } | null;
	creatureTier: {
		actions: JsonValue;
		actionOverrides: JsonValue;
	} | null;
}

interface RuntimeEncounterParticipant {
	id: string;
	isActive: boolean;
	currentPotential: number;
	sortOrder: number;
}

interface RuntimeEncounter {
	campaign: {
		combatActionResolutionMode: string;
	};
	participants: RuntimeEncounterParticipant[];
}

export class CombatEncounterRuntimeEngine {
	findParticipantAction(
		actor: RuntimeParticipantActionSource,
		actionSlug: string
	) {
		const actions = [
			...this.readRuntimeActions(actor.creature?.actions),
			...this.readRuntimeActions(actor.creatureTier?.actions),
			...this.readRuntimeActions(actor.creatureTier?.actionOverrides)
		];
		const actionBySlug = actions.reduce<Map<string, RuntimeAction>>(
			(result, action) => result.set(action.slug, action),
			new Map<string, RuntimeAction>()
		);

		return actionBySlug.get(actionSlug) ?? null;
	}

	readRuntimeActions(value: JsonValue | undefined) {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => this.readRuntimeAction(item))
			.filter((item): item is RuntimeAction => !!item);
	}

	readRuntimeAction(value: JsonValue): RuntimeAction | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const slug = this.readString(value, 'slug');
		const name = this.readString(value, 'name');
		const kind = this.readString(value, 'kind');

		if (!slug || !name || !kind) {
			return null;
		}

		return {
			slug,
			name,
			kind,
			source: this.readActionSource(value['source']),
			cost: this.readActionCost(value['cost']),
			target: this.readActionTarget(value['target']),
			roll: this.readActionRoll(value['roll']),
			defense: this.readActionDefense(value['defense']),
			effects: this.readRuntimeEffects(value['effects']),
			isActive: this.readBoolean(value, 'isActive') ?? true,
			sortOrder: this.readNumber(value, 'sortOrder')
		};
	}

	readDefenseOptions(value: JsonValue): CombatDefenseOption[] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => {
				if (!this.isJsonObject(item)) {
					return null;
				}

				const mode = this.readString(item, 'mode');

				if (mode !== 'dodge' && mode !== 'parry' && mode !== 'none') {
					return null;
				}

				return {
					mode,
					label: this.readString(item, 'label') ?? 'Защита',
					skillSlug: this.readString(item, 'skillSlug'),
					skillName: this.readString(item, 'skillName')
				};
			})
			.filter((item): item is CombatDefenseOption => !!item);
	}

	readResolvedRoll(value: JsonValue): CombatResolvedRoll | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return {
			skillSlug: this.readString(value, 'skillSlug'),
			skillName: this.readString(value, 'skillName') ?? 'Проверка',
			characteristicSlug: this.readString(value, 'characteristicSlug'),
			characteristicName:
				this.readString(value, 'characteristicName') ?? 'Характеристика',
			diceCount: this.readNumber(value, 'diceCount') ?? 0,
			dice: this.readNumberArray(value['dice']),
			successes: this.readNumber(value, 'successes') ?? 0,
			sixes: this.readNumber(value, 'sixes') ?? 0,
			ones: this.readNumber(value, 'ones') ?? 0,
			ignoredOnes: this.readNumber(value, 'ignoredOnes') ?? 0,
			consequenceCount: this.readNumber(value, 'consequenceCount') ?? 0,
			skillLevel: this.readNumber(value, 'skillLevel') ?? 0
		};
	}

	readDeclaredActionId(value: JsonValue) {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return this.readString(value, 'declaredActionId');
	}

	actionRequiresSelectedTarget(action: RuntimeAction) {
		return (
			action.target?.type === 'creature' ||
			action.target?.type === 'hostile_creature'
		);
	}

	resolveActionPotentialAfterCost(
		actor: { currentPotential: number },
		action: RuntimeAction
	) {
		const potentialCost =
			action.cost?.mode === 'fixed' ? (action.cost.potential ?? 0) : 0;
		return Math.max(0, actor.currentPotential - Math.max(0, potentialCost));
	}

	canResolveDeclaredAction(
		encounter: RuntimeEncounter,
		declaredAction: { resolveAtPotential: number }
	) {
		const highestParticipantPotential = encounter.participants.reduce(
			(highest, participant) =>
				participant.isActive
					? Math.max(highest, participant.currentPotential)
					: highest,
			0
		);

		return highestParticipantPotential <= declaredAction.resolveAtPotential;
	}

	resolveActiveParticipant(encounter: RuntimeEncounter) {
		return [...encounter.participants]
			.filter(
				participant => participant.isActive && participant.currentPotential > 0
			)
			.sort(
				(left, right) =>
					right.currentPotential - left.currentPotential ||
					left.sortOrder - right.sortOrder
			)[0];
	}

	resolvePotentialAfterSkip(
		encounter: RuntimeEncounter,
		participantId: string
	) {
		const nextParticipant = [...encounter.participants]
			.filter(
				participant =>
					participant.isActive &&
					participant.id !== participantId &&
					participant.currentPotential > 0
			)
			.sort(
				(left, right) =>
					right.currentPotential - left.currentPotential ||
					left.sortOrder - right.sortOrder
			)[0];

		return nextParticipant
			? Math.max(0, nextParticipant.currentPotential - 1)
			: 0;
	}

	resolveCampaignActionResolutionMode(
		encounter: RuntimeEncounter
	): 'delayed' | 'immediate' {
		return encounter.campaign.combatActionResolutionMode === 'immediate'
			? 'immediate'
			: 'delayed';
	}

	resolveCombatActionResult(
		attackRoll: CombatResolvedRoll | null,
		defenseRoll: CombatResolvedRoll | null
	) {
		if (!attackRoll) {
			return { cleanSuccesses: 0 };
		}

		return {
			cleanSuccesses: Math.max(
				0,
				attackRoll.successes - (defenseRoll?.successes ?? 0)
			)
		};
	}

	private readActionRoll(
		value: JsonValue | undefined
	): RuntimeActionRoll | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (type !== 'none' && type !== 'attack_profile' && type !== 'check') {
			return null;
		}

		return {
			type,
			characteristic: this.readReference(value['characteristic']),
			skill: this.readReference(value['skill'])
		};
	}

	private readActionDefense(
		value: JsonValue | undefined
	): RuntimeActionDefense | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (type !== 'none' && type !== 'target_physical_defense') {
			return null;
		}

		const canParry = this.readBoolean(value, 'canParry') ?? false;

		return {
			type,
			canDodge: this.readBoolean(value, 'canDodge') ?? false,
			canParry,
			parrySkillGroups: canParry
				? this.readParrySkillGroups(value['parrySkillGroups'])
				: []
		};
	}

	private readActionCost(value: JsonValue | undefined) {
		if (!this.isJsonObject(value)) {
			return undefined;
		}

		return {
			mode: this.readString(value, 'mode') ?? undefined,
			potential: this.readNumber(value, 'potential')
		};
	}

	private readActionSource(
		value: JsonValue | undefined
	): RuntimeActionSource | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return {
			type: this.readString(value, 'type') ?? 'custom',
			name: this.readString(value, 'name') ?? '',
			slug: this.readString(value, 'slug') ?? '',
			profileName: this.readString(value, 'profileName') ?? '',
			intent: this.readReference(value['intent'])
		};
	}

	private readActionTarget(value: JsonValue | undefined) {
		if (!this.isJsonObject(value)) {
			return undefined;
		}

		return {
			type: this.readString(value, 'type') ?? undefined
		};
	}

	private readRuntimeEffects(value: JsonValue | undefined) {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => this.readRuntimeEffect(item))
			.filter((item): item is RuntimeActionEffect => !!item);
	}

	private readRuntimeEffect(value: JsonValue): RuntimeActionEffect | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (!type) {
			return null;
		}

		return {
			type,
			value: this.readNumber(value, 'value'),
			damageMode: this.readDamageMode(value),
			damageType: this.readReference(value['damageType']),
			condition: this.readReference(value['condition']),
			linkedCondition: this.readReference(value['linkedCondition']),
			conditionDisplayName: this.readString(value, 'conditionDisplayName'),
			conditionLevel: this.readNumber(value, 'conditionLevel'),
			targetScope: this.readString(value, 'targetScope'),
			requiresDamageAfterArmor:
				this.readBoolean(value, 'requiresDamageAfterArmor') ?? false,
			text: this.readString(value, 'text'),
			sortOrder: this.readNumber(value, 'sortOrder')
		};
	}

	private readDamageMode(value: Record<string, JsonValue>) {
		const mode = this.readString(value, 'damageMode');

		return mode === 'clean_successes' ||
			mode === 'clean_successes_plus_base' ||
			mode === 'base_damage'
			? mode
			: null;
	}

	private readReference(
		value: JsonValue | undefined
	): RuntimeActionReference | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const name = this.readString(value, 'name');
		const slug = this.readString(value, 'slug');

		return name && slug ? { name, slug } : null;
	}

	private isJsonObject(
		value: JsonValue | undefined
	): value is Record<string, JsonValue> {
		return !!value && typeof value === 'object' && !Array.isArray(value);
	}

	private readString(
		value: Record<string, JsonValue>,
		key: string
	): string | null {
		const rawValue = value[key];
		return typeof rawValue === 'string' ? rawValue : null;
	}

	private readNumber(
		value: Record<string, JsonValue>,
		key: string
	): number | null {
		const rawValue = value[key];
		return typeof rawValue === 'number' && Number.isFinite(rawValue)
			? rawValue
			: null;
	}

	private readNumberArray(value: JsonValue | undefined): number[] {
		return Array.isArray(value)
			? value.filter(
					(item): item is number =>
						typeof item === 'number' && Number.isFinite(item)
				)
			: [];
	}

	private readBoolean(
		value: Record<string, JsonValue>,
		key: string
	): boolean | null {
		const rawValue = value[key];
		return typeof rawValue === 'boolean' ? rawValue : null;
	}

	private readParrySkillGroups(
		value: JsonValue | undefined
	): RuntimeActionDefense['parrySkillGroups'] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(item): item is RuntimeActionDefense['parrySkillGroups'][number] =>
				item === 'unarmed' || item === 'melee_weapon' || item === 'shield'
		);
	}
}
