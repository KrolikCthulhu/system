import { Injectable } from '@nestjs/common';
import {
	CampaignMemberRole,
	campaignMemberRoles
} from './domain/combat-encounter.types';
import { CombatEncounterRuntimeService } from './domain/combat-encounter-runtime.service';
import { RuntimeAction } from './domain/combat-encounter-runtime.types';
import { JsonValue } from './domain/json.types';
import { coreCombatActionKeys } from './domain/core-combat-actions';
import type {
	CombatEncounterParticipantReadModel,
	CombatEncounterReadModel
} from './application/combat-encounter.read-model';
import { CombatActionAvailabilityService } from './combat-action-availability.service';
import { BasicCombatActionProvider } from './combat-action-providers/basic-combat-action.provider';
import { ConditionCombatActionProvider } from './combat-action-providers/condition-combat-action.provider';
import { CreatureCombatActionProvider } from './combat-action-providers/creature-combat-action.provider';
import {
	CombatActionDefinition,
	CombatActionTargetMode,
	CombatAvailableActionGroup,
	CombatAvailableActionOption,
	CombatAvailableActions
} from './combat-available-actions.types';

@Injectable()
export class CombatAvailableActionsService {
	constructor(
		private readonly runtime: CombatEncounterRuntimeService,
		private readonly availability: CombatActionAvailabilityService,
		private readonly basicActions: BasicCombatActionProvider,
		private readonly creatureActions: CreatureCombatActionProvider,
		private readonly conditionActions: ConditionCombatActionProvider
	) {}

	async buildForParticipant(
		encounter: CombatEncounterReadModel,
		participant: CombatEncounterParticipantReadModel,
		currentUserRole: CampaignMemberRole,
		currentUserId: string
	): Promise<CombatAvailableActions> {
		if (
			!this.canShowParticipantActions(
				encounter,
				participant,
				currentUserRole,
				currentUserId
			)
		) {
			return this.emptyActions();
		}

		const context = {
			encounter,
			participant,
			currentUserRole,
			currentUserId
		};
		const definitions = await this.collectActionDefinitions(context);
		const actions = definitions.map(definition =>
			this.toActionOption(encounter, participant, definition)
		);

		return {
			attacks: this.groupAttacks(participant, actions),
			abilities: actions.filter(action => action.kind === 'active_ability'),
			contextualActions: actions.filter(
				action => action.kind === 'condition_action'
			),
			systemActions: actions.filter(action => action.kind === 'system')
		};
	}

	private canShowParticipantActions(
		encounter: CombatEncounterReadModel,
		participant: CombatEncounterParticipantReadModel,
		currentUserRole: CampaignMemberRole,
		currentUserId: string
	) {
		if (encounter.status !== 'ACTIVE') {
			return false;
		}

		if (participant.kind === 'CREATURE') {
			return currentUserRole === 'GM';
		}

		return (
			currentUserRole === campaignMemberRoles.gm ||
			participant.playerCharacter?.ownerUser.id === currentUserId
		);
	}

	private async collectActionDefinitions(context: {
		encounter: CombatEncounterReadModel;
		participant: CombatEncounterParticipantReadModel;
		currentUserRole: CampaignMemberRole;
		currentUserId: string;
	}) {
		if (
			context.currentUserRole === campaignMemberRoles.gm &&
			context.participant.kind === 'PLAYER_CHARACTER'
		) {
			return this.basicActions.collect(context);
		}

		const [creatureActions, conditionActions, basicActions] =
			await Promise.all([
				this.creatureActions.collect(context),
				this.conditionActions.collect(context),
				this.basicActions.collect(context)
			]);
		const definitions = [
			...creatureActions,
			...conditionActions,
			...basicActions
		];

		const bySlug = definitions.reduce<Map<string, CombatActionDefinition>>(
			(result, definition) => result.set(definition.action.slug, definition),
			new Map<string, CombatActionDefinition>()
		);

		return [...bySlug.values()].sort(
			(first, second) =>
				(first.action.sortOrder ?? 0) - (second.action.sortOrder ?? 0)
		);
	}

	private toActionOption(
		encounter: CombatEncounterReadModel,
		participant: CombatEncounterParticipantReadModel,
		definition: CombatActionDefinition
	): CombatAvailableActionOption {
		const { action } = definition;
		const availability = this.availability.evaluate({
			encounter,
			actor: participant,
			action
		});

		return {
			id: action.slug,
			actionSlug: action.slug,
			label: action.name,
			kind: action.kind,
			sourceType: definition.sourceType,
			sourceName: action.source?.name ?? 'Источник не задан',
			sourceSlug: action.source?.slug ?? null,
			profileName: action.source?.profileName ?? '',
			targetMode: this.resolveTargetMode(action),
			requiresTarget: this.runtime.actionRequiresSelectedTarget(action),
			costText: this.actionCostText(action),
			rangeText: this.actionRangeText(participant, action),
			description:
				typeof action.playerText === 'string' ? action.playerText : '',
			targetChoiceLabel: action.targetChoiceLabel ?? null,
			confirmationTitle: action.confirmationTitle ?? null,
			optionLabelTemplate: action.optionLabelTemplate ?? null,
			costLabelTemplate: action.costLabelTemplate ?? null,
			sortOrder: action.sortOrder ?? 0,
			isAvailable: availability.isAvailable,
			disabledReason: availability.reasons[0] ?? null,
			disabledReasons: availability.reasons,
			availableTargets: this.buildAvailableTargets(encounter, participant, action)
		};
	}

	private buildAvailableTargets(
		encounter: CombatEncounterReadModel,
		participant: CombatEncounterParticipantReadModel,
		action: RuntimeAction
	) {
		if (!this.runtime.actionRequiresSelectedTarget(action)) {
			return [];
		}

		return encounter.participants
			.filter(target => target.isActive && target.id !== participant.id)
			.map(target => {
				const availability = this.availability.evaluate({
					encounter,
					actor: participant,
					action,
					targetParticipantId: target.id,
					validateSelectedTarget: true
				});

				return {
					participantId: target.id,
					label: target.sceneName,
					potentialCost: this.resolveTargetPotentialCost(
						participant,
						target,
						action
					),
					costText: this.resolveTargetCostText(participant, target, action),
					isAvailable: availability.isAvailable,
					disabledReason: availability.reasons[0] ?? null,
					disabledReasons: availability.reasons
				};
			});
	}

	private resolveTargetPotentialCost(
		participant: CombatEncounterParticipantReadModel,
		target: CombatEncounterParticipantReadModel,
		action: RuntimeAction
	) {
		if (action.slug !== coreCombatActionKeys.waitUntilAfterParticipant) {
			return null;
		}

		return Math.max(
			0,
			participant.currentPotential - target.currentPotential + 1
		);
	}

	private resolveTargetCostText(
		participant: CombatEncounterParticipantReadModel,
		target: CombatEncounterParticipantReadModel,
		action: RuntimeAction
	) {
		const potentialCost = this.resolveTargetPotentialCost(
			participant,
			target,
			action
		);

		if (potentialCost === null) {
			return '';
		}

		return (action.costLabelTemplate ?? '−{cost}').replace(
			'{cost}',
			String(potentialCost)
		);
	}

	private groupAttacks(
		participant: CombatEncounterParticipantReadModel,
		actions: CombatAvailableActionOption[]
	) {
		const groups = new Map<string, CombatAvailableActionGroup>();

		for (const action of actions.filter(item => item.kind === 'attack')) {
			const sourceName = action.sourceName || 'Источник не задан';
			const group = groups.get(sourceName) ?? {
				id: action.sourceSlug || sourceName,
				kind: 'attack',
				sourceName,
				profileName: action.profileName,
				rangeText: action.rangeText,
				costText: action.costText,
				actions: []
			};
			group.actions.push(action);
			groups.set(sourceName, group);
		}

		return [...groups.values()];
	}

	private actionCostText(action: RuntimeAction) {
		switch (action.cost?.mode) {
			case 'free':
				return '0';
			case 'fixed':
				return `${action.cost.potential ?? 0}`;
			case 'per_meter':
				return `${this.readPerMeter(action.cost) ?? 0}/м`;
			case 'rule':
				return 'по правилу';
		}
	}

	private actionRangeText(
		participant: CombatEncounterParticipantReadModel,
		action: RuntimeAction
	) {
		const rangeMeters = this.actionRangeMeters(participant, action);
		return rangeMeters === null ? '' : `${rangeMeters} м`;
	}

	private actionRangeMeters(
		participant: CombatEncounterParticipantReadModel,
		action: RuntimeAction
	) {
		if (action.source?.type !== 'natural_attack') {
			return null;
		}

		const naturalAttack = participant.creature?.naturalAttackLinks.find(
			item => item.naturalAttack.slug === action.source?.slug
		);
		const profile = this.toJsonArray(naturalAttack?.attackProfiles).find(
			item => this.hasProfileName(item, action.source?.profileName)
		);

		if (
			!profile ||
			typeof profile !== 'object' ||
			!('rangeMeters' in profile) ||
			typeof profile.rangeMeters !== 'number'
		) {
			return null;
		}

		return profile.rangeMeters;
	}

	private toJsonArray(value: JsonValue | undefined) {
		return Array.isArray(value) ? value : [];
	}

	private hasProfileName(
		value: JsonValue,
		profileName: string | undefined
	): value is { name: string; rangeMeters?: JsonValue } {
		return (
			typeof value === 'object' &&
			value !== null &&
			'name' in value &&
			value.name === profileName
		);
	}

	private readPerMeter(cost: RuntimeAction['cost']) {
		if (!cost || !('perMeter' in cost) || typeof cost.perMeter !== 'number') {
			return null;
		}

		return cost.perMeter;
	}

	private resolveTargetMode(action: RuntimeAction): CombatActionTargetMode {
		switch (action.target?.type) {
			case 'self':
				return 'self';
			case 'linked_condition_target':
				return 'linked_condition_target';
			case 'creature':
			case 'hostile_creature':
			case 'marked_target':
				return 'selected_target';
			default:
				return 'none';
		}
	}

	private emptyActions(): CombatAvailableActions {
		return {
			attacks: [],
			abilities: [],
			contextualActions: [],
			systemActions: []
		};
	}
}
