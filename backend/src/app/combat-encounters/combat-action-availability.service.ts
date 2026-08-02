import { Injectable } from '@nestjs/common';
import {
	RuntimeAction,
	RuntimeActionAvailabilityComparisonOperand,
	RuntimeActionAvailabilityComparisonOperator,
	RuntimeActionAvailabilityRule
} from './domain/combat-encounter-runtime.types';
import { coreCombatActionKeys } from './domain/core-combat-actions';
import type {
	CombatEncounterParticipantReadModel,
	CombatEncounterReadModel
} from './application/combat-encounter.read-model';

export interface CombatActionAvailabilityContext {
	encounter: CombatEncounterReadModel;
	actor: CombatEncounterParticipantReadModel;
	action: RuntimeAction;
	targetParticipantId?: string | null;
	validateSelectedTarget?: boolean;
}

export interface CombatActionAvailabilityResult {
	isAvailable: boolean;
	reasons: string[];
}

@Injectable()
export class CombatActionAvailabilityService {
	evaluate(context: CombatActionAvailabilityContext) {
		const reasons = [
			...this.evaluateBaseRules(context),
			...this.evaluateTargetRules(context),
			...this.evaluateConfiguredRules(context)
		];

		return {
			isAvailable: reasons.length === 0,
			reasons
		};
	}

	private evaluateBaseRules(context: CombatActionAvailabilityContext) {
		const reasons: string[] = [];

		if (context.encounter.status !== 'ACTIVE') {
			reasons.push('Бой не активен.');
		}

		if (!context.encounter.isActive || !context.actor.isActive) {
			reasons.push('Участник не активен.');
		}

		if (context.action.isActive === false) {
			reasons.push('Действие отключено.');
		}

		if (
			context.action.slug !== coreCombatActionKeys.endRoundParticipation &&
			this.resolveActiveParticipant(context.encounter)?.id !== context.actor.id
		) {
			reasons.push('Сейчас действует другой участник.');
		}

		if (
			context.action.slug === coreCombatActionKeys.endRoundParticipation &&
			this.hasEndedRoundParticipation(context)
		) {
			reasons.push('Участник уже завершил участие в этом раунде.');
		}

		if (
			context.action.slug === coreCombatActionKeys.enterDefenseStance &&
			this.isInDefenseStance(context)
		) {
			reasons.push('Участник уже в обороне.');
		}

		if (
			context.action.slug !== coreCombatActionKeys.enterDefenseStance &&
			context.action.slug !== coreCombatActionKeys.endRoundParticipation &&
			this.isInDefenseStance(context)
		) {
			reasons.push('Участник в обороне до конца раунда.');
		}

		if (
			context.action.slug !== coreCombatActionKeys.endRoundParticipation &&
			this.hasEndedRoundParticipation(context)
		) {
			reasons.push('Участник завершил участие в раунде.');
		}

		if (
			context.action.slug === coreCombatActionKeys.waitUntilAfterParticipant &&
			!this.hasWaitTargetCandidate(context)
		) {
			reasons.push('Нет участника, после которого можно действовать.');
		}

		if (context.action.cost?.mode === 'fixed') {
			const cost = Math.max(0, context.action.cost.potential ?? 0);

			if (context.actor.currentPotential < cost) {
				reasons.push('Недостаточно Потенциала.');
			}
		}

		return reasons;
	}

	private evaluateTargetRules(context: CombatActionAvailabilityContext) {
		const reasons: string[] = [];
		const targetType = context.action.target?.type ?? 'none';
		const selectedTarget = this.findTarget(context);

		if (
			(targetType === 'creature' || targetType === 'hostile_creature') &&
			context.validateSelectedTarget &&
			!context.targetParticipantId
		) {
			reasons.push('Нужно выбрать цель.');
		}

		if (
			context.validateSelectedTarget &&
			context.targetParticipantId &&
			!selectedTarget
		) {
			reasons.push('Цель недоступна.');
		}

		if (
			selectedTarget &&
			selectedTarget.id === context.actor.id &&
			(targetType === 'creature' || targetType === 'hostile_creature')
		) {
			reasons.push('Нельзя выбрать исполнителя целью этого действия.');
		}

		if (
			targetType === 'linked_condition_target' &&
			!this.findLinkedConditionTarget(context)
		) {
			reasons.push('Требуется связанная цель состояния.');
		}

		if (
			context.action.slug === coreCombatActionKeys.waitUntilAfterParticipant &&
			context.validateSelectedTarget &&
			selectedTarget &&
			selectedTarget.currentPotential >= context.actor.currentPotential
		) {
			reasons.push('Можно выждать только после участника с меньшим Потенциалом.');
		}

		return reasons;
	}

	private hasWaitTargetCandidate(context: CombatActionAvailabilityContext) {
		if (context.action.slug !== coreCombatActionKeys.waitUntilAfterParticipant) {
			return true;
		}

		return context.encounter.participants.some(
			participant =>
				participant.id !== context.actor.id &&
				participant.isActive &&
				participant.defenseStanceRound !== context.encounter.currentRound &&
				participant.roundParticipationEndedRound !==
					context.encounter.currentRound &&
				participant.currentPotential < context.actor.currentPotential
		);
	}

	private evaluateConfiguredRules(context: CombatActionAvailabilityContext) {
		return (context.action.availabilityRules ?? [])
			.map(rule => this.evaluateConfiguredRule(context, rule))
			.filter((reason): reason is string => !!reason);
	}

	private evaluateConfiguredRule(
		context: CombatActionAvailabilityContext,
		rule: RuntimeActionAvailabilityRule
	) {
		switch (rule.type) {
			case 'resource_free':
				return null;
			case 'active_condition':
				return this.evaluateActiveConditionRule(context, rule);
			case 'comparison':
				return this.evaluateComparisonRule(context, rule);
			case 'special_rule':
				return null;
		}
	}

	private evaluateActiveConditionRule(
		context: CombatActionAvailabilityContext,
		rule: RuntimeActionAvailabilityRule
	) {
		const conditionSlug = rule.condition?.slug;

		if (!conditionSlug) {
			return null;
		}

		const hasCondition = context.actor.conditions.some(
			condition =>
				condition.isActive && condition.condition.slug === conditionSlug
		);

		return hasCondition
			? null
			: this.ruleUnavailableText(
					rule,
					`Требуется состояние: ${rule.condition?.name ?? conditionSlug}.`
				);
	}

	private evaluateComparisonRule(
		context: CombatActionAvailabilityContext,
		rule: RuntimeActionAvailabilityRule
	) {
		if (
			!context.validateSelectedTarget &&
			this.ruleDependsOnSelectedTarget(rule) &&
			!this.findLinkedConditionTarget(context)
		) {
			return null;
		}

		const left = this.resolveOperand(context, rule.left ?? null);
		const right = this.resolveOperand(context, rule.right ?? null);

		if (left === null || right === null || !rule.operator) {
			return this.ruleUnavailableText(rule, 'Условие действия не выполнено.');
		}

		return this.compare(left, right, rule.operator)
			? null
			: this.ruleUnavailableText(rule, 'Условие действия не выполнено.');
	}

	private resolveOperand(
		context: CombatActionAvailabilityContext,
		operand: RuntimeActionAvailabilityComparisonOperand | null
	) {
		if (!operand) {
			return null;
		}

		if (operand.kind === 'constant') {
			return typeof operand.value === 'number' ? operand.value : null;
		}

		if (operand.property !== 'sizeRank') {
			return null;
		}

		const participant =
			operand.kind === 'actor_property'
				? context.actor
				: this.resolveRuleTarget(context);

		return participant?.creatureTier?.size?.rank ?? null;
	}

	private compare(
		left: number,
		right: number,
		operator: RuntimeActionAvailabilityComparisonOperator
	) {
		switch (operator) {
			case 'gt':
				return left > right;
			case 'gte':
				return left >= right;
			case 'eq':
				return left === right;
			case 'ne':
				return left !== right;
			case 'lte':
				return left <= right;
			case 'lt':
				return left < right;
		}
	}

	private resolveRuleTarget(context: CombatActionAvailabilityContext) {
		return (
			this.findTarget(context) ??
			this.findLinkedConditionTargetParticipant(context) ??
			null
		);
	}

	private findTarget(context: CombatActionAvailabilityContext) {
		if (!context.targetParticipantId) {
			return null;
		}

		return (
			context.encounter.participants.find(
				participant =>
					participant.id === context.targetParticipantId &&
					participant.isActive
			) ?? null
		);
	}

	private resolveActiveParticipant(encounter: CombatEncounterReadModel) {
		return [...encounter.participants]
			.filter(
				participant =>
					participant.isActive &&
					participant.currentPotential > 0 &&
					participant.defenseStanceRound !== encounter.currentRound &&
					participant.roundParticipationEndedRound !== encounter.currentRound
			)
			.sort(
				(left, right) =>
					right.currentPotential - left.currentPotential ||
					left.sortOrder - right.sortOrder
			)[0];
	}

	private isInDefenseStance(context: CombatActionAvailabilityContext) {
		return context.actor.defenseStanceRound === context.encounter.currentRound;
	}

	private hasEndedRoundParticipation(
		context: CombatActionAvailabilityContext
	) {
		return (
			context.actor.roundParticipationEndedRound ===
			context.encounter.currentRound
		);
	}

	private findLinkedConditionTarget(context: CombatActionAvailabilityContext) {
		return this.findLinkedConditionLink(context)?.targetParticipantId ?? null;
	}

	private findLinkedConditionTargetParticipant(
		context: CombatActionAvailabilityContext
	) {
		const targetParticipantId = this.findLinkedConditionTarget(context);

		if (!targetParticipantId) {
			return null;
		}

		return (
			context.encounter.participants.find(
				participant =>
					participant.id === targetParticipantId && participant.isActive
			) ?? null
		);
	}

	private findLinkedConditionLink(context: CombatActionAvailabilityContext) {
		const actionConditionSlug = context.action.source?.slug ?? null;
		const linkedConditionSlug =
			context.action.effects?.find(effect => effect.linkedCondition?.slug)
				?.linkedCondition?.slug ?? null;

		return context.encounter.conditionLinks.find(link => {
			if (!link.isActive || link.sourceParticipantId !== context.actor.id) {
				return false;
			}

			if (
				actionConditionSlug &&
				link.sourceCondition.slug !== actionConditionSlug
			) {
				return false;
			}

			if (
				linkedConditionSlug &&
				link.targetCondition.slug !== linkedConditionSlug
			) {
				return false;
			}

			return true;
		});
	}

	private ruleUnavailableText(
		rule: RuntimeActionAvailabilityRule,
		fallback: string
	) {
		return rule.unavailableText?.trim() || rule.label?.trim() || fallback;
	}

	private ruleDependsOnSelectedTarget(rule: RuntimeActionAvailabilityRule) {
		return (
			rule.left?.kind === 'target_property' ||
			rule.right?.kind === 'target_property'
		);
	}
}
