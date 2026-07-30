import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import {
	AppliedRuntimeState,
	RuntimeAction,
	RuntimeActionEffect
} from './domain/combat-encounter-runtime.types';
import {
	createConditionAppliedEvent,
	createConditionRemovedEvent,
	createConditionsLinkedEvent,
	createConditionsUnlinkedEvent,
	createDamageEffectEvent,
	createMoveLinkedTargetEvent,
	createTextEffectEvent,
	createUnsupportedEffectEvent
} from './domain/combat-encounter-events';
import { CombatActionEffectEngine } from './domain/combat-action-effect.engine';

interface ApplyActionEffectInput {
	encounterId: string;
	actorParticipantId: string;
	selectedTargetParticipantId: string | null;
	action: RuntimeAction;
	effect: RuntimeActionEffect;
	result: { cleanSuccesses?: number };
	state: AppliedRuntimeState;
}

@Injectable()
export class CombatEncounterEffectRuntimeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly effectEngine: CombatActionEffectEngine
	) {}

	async spendActionPotential(
		tx: Prisma.TransactionClient,
		actor: { id: string; currentPotential: number },
		action: RuntimeAction
	) {
		const potentialCost =
			action.cost?.mode === 'fixed' ? (action.cost.potential ?? 0) : 0;

		if (potentialCost <= 0) {
			return;
		}

		await tx.combatEncounterParticipant.update({
			where: { id: actor.id },
			data: {
				currentPotential: Math.max(0, actor.currentPotential - potentialCost)
			}
		});
	}

	async applyActionEffect(
		tx: Prisma.TransactionClient,
		input: ApplyActionEffectInput
	) {
		switch (input.effect.type) {
			case 'damage':
				await this.applyDamageEffect(tx, input);
				return;
			case 'apply_condition':
				await this.applyConditionEffect(tx, input);
				return;
			case 'remove_condition':
				await this.removeConditionEffect(tx, input);
				return;
			case 'link_condition':
				await this.linkConditionEffect(tx, input);
				return;
			case 'unlink_condition':
				await this.unlinkConditionEffect(tx, input);
				return;
			case 'move_linked_target':
				await this.moveLinkedTargetEffect(input);
				return;
			case 'special_rule':
			case 'dice_pool_modifier':
				input.state.events.push(
					createTextEffectEvent({
						type: input.effect.type,
						text: input.effect.text ?? ''
					})
				);
				return;
			default:
				input.state.events.push(
					createUnsupportedEffectEvent({ effectType: input.effect.type })
				);
		}
	}

	private async applyDamageEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
			result: { cleanSuccesses?: number };
			state: AppliedRuntimeState;
		}
	) {
		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);
		const damage = this.effectEngine.resolveDamage(input.effect, input.result);

		if (!targetParticipantId || damage <= 0) {
			input.state.lastDamageAfterArmor = 0;
			return;
		}

		const target = await tx.combatEncounterParticipant.findUnique({
			select: { currentHealth: true },
			where: { id: targetParticipantId }
		});

		if (!target) {
			throw new NotFoundException('Цель эффекта не найдена.');
		}

		await tx.combatEncounterParticipant.update({
			where: { id: targetParticipantId },
			data: {
				currentHealth: Math.max(0, target.currentHealth - damage)
			}
		});

		input.state.lastDamageAfterArmor = damage;
		input.state.events.push(
			createDamageEffectEvent({
				targetParticipantId,
				value: damage,
				damageType: input.effect.damageType?.slug ?? null
			})
		);
	}

	private async applyConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			encounterId: string;
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			action: RuntimeAction;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);

		if (!targetParticipantId) {
			return;
		}

		const condition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const instance = await tx.combatEncounterParticipantCondition.create({
			data: {
				encounterId: input.encounterId,
				participantId: targetParticipantId,
				conditionId: condition.id,
				displayName: input.effect.conditionDisplayName?.trim() || null,
				level: input.effect.conditionLevel ?? input.effect.value ?? 1,
				sourceParticipantId: input.actorParticipantId,
				sourceActionSlug: input.action.slug,
				metadata: {} as Prisma.InputJsonValue
			}
		});

		input.state.conditionInstances.set(
			this.effectEngine.conditionInstanceKey(targetParticipantId, condition.id),
			instance.id
		);
		input.state.events.push(
			createConditionAppliedEvent({
				targetParticipantId,
				conditionId: condition.id,
				conditionSlug: condition.slug,
				level: instance.level
			})
		);
	}

	private async removeConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);

		if (!targetParticipantId) {
			return;
		}

		const condition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const result = await tx.combatEncounterParticipantCondition.updateMany({
			where: {
				participantId: targetParticipantId,
				conditionId: condition.id,
				isActive: true
			},
			data: { isActive: false }
		});

		input.state.events.push(
			createConditionRemovedEvent({
				targetParticipantId,
				conditionId: condition.id,
				conditionSlug: condition.slug,
				count: result.count
			})
		);
	}

	private async linkConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			encounterId: string;
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			action: RuntimeAction;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (
			!input.selectedTargetParticipantId ||
			!input.effect.condition?.slug ||
			!input.effect.linkedCondition?.slug
		) {
			return;
		}

		const [sourceCondition, targetCondition] = await Promise.all([
			this.findConditionBySlug(input.effect.condition.slug),
			this.findConditionBySlug(input.effect.linkedCondition.slug)
		]);
		const sourceConditionInstanceId = await this.resolveConditionInstanceId(
			tx,
			{
				participantId: input.actorParticipantId,
				conditionId: sourceCondition.id,
				state: input.state
			}
		);
		const targetConditionInstanceId = await this.resolveConditionInstanceId(
			tx,
			{
				participantId: input.selectedTargetParticipantId,
				conditionId: targetCondition.id,
				state: input.state
			}
		);

		await tx.combatEncounterConditionLink.create({
			data: {
				encounterId: input.encounterId,
				sourceParticipantId: input.actorParticipantId,
				targetParticipantId: input.selectedTargetParticipantId,
				sourceConditionId: sourceCondition.id,
				targetConditionId: targetCondition.id,
				sourceConditionInstanceId,
				targetConditionInstanceId,
				sourceActionSlug: input.action.slug,
				metadata: {} as Prisma.InputJsonValue
			}
		});

		input.state.linkedTargetParticipantId = input.selectedTargetParticipantId;
		input.state.events.push(
			createConditionsLinkedEvent({
				sourceParticipantId: input.actorParticipantId,
				targetParticipantId: input.selectedTargetParticipantId,
				sourceConditionSlug: sourceCondition.slug,
				targetConditionSlug: targetCondition.slug
			})
		);
	}

	private async unlinkConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const sourceCondition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const targetCondition = input.effect.linkedCondition?.slug
			? await this.findConditionBySlug(input.effect.linkedCondition.slug)
			: null;
		const link = await tx.combatEncounterConditionLink.findFirst({
			select: { id: true, targetParticipantId: true },
			where: {
				sourceParticipantId: input.actorParticipantId,
				sourceConditionId: sourceCondition.id,
				targetConditionId: targetCondition?.id,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		if (!link) {
			return;
		}

		await tx.combatEncounterConditionLink.update({
			where: { id: link.id },
			data: { isActive: false }
		});

		input.state.linkedTargetParticipantId = link.targetParticipantId;
		input.state.events.push(
			createConditionsUnlinkedEvent({
				linkId: link.id,
				targetParticipantId: link.targetParticipantId,
				sourceConditionSlug: sourceCondition.slug,
				targetConditionSlug: targetCondition?.slug ?? null
			})
		);
	}

	private async moveLinkedTargetEffect(input: {
		effect: RuntimeActionEffect;
		state: AppliedRuntimeState;
	}) {
		input.state.events.push(
			createMoveLinkedTargetEvent({
				targetParticipantId: input.state.linkedTargetParticipantId,
				sourceConditionSlug: input.effect.condition?.slug ?? null,
				value: input.effect.value ?? null
			})
		);
	}

	private async resolveEffectTargetParticipantId(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
		}
	) {
		switch (input.effect.targetScope) {
			case 'actor':
				return input.actorParticipantId;
			case 'linked_condition_target':
				return this.findLinkedTargetParticipantId(tx, {
					actorParticipantId: input.actorParticipantId,
					sourceConditionSlug: input.effect.condition?.slug ?? null
				});
			case 'selected_target':
			default:
				return input.selectedTargetParticipantId;
		}
	}

	private async findLinkedTargetParticipantId(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			sourceConditionSlug: string | null;
		}
	) {
		const sourceCondition = input.sourceConditionSlug
			? await this.findConditionBySlug(input.sourceConditionSlug)
			: null;
		const link = await tx.combatEncounterConditionLink.findFirst({
			select: { targetParticipantId: true },
			where: {
				sourceParticipantId: input.actorParticipantId,
				sourceConditionId: sourceCondition?.id,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return link?.targetParticipantId ?? null;
	}

	private async resolveConditionInstanceId(
		tx: Prisma.TransactionClient,
		input: {
			participantId: string;
			conditionId: string;
			state: AppliedRuntimeState;
		}
	) {
		const cachedId = input.state.conditionInstances.get(
			this.effectEngine.conditionInstanceKey(
				input.participantId,
				input.conditionId
			)
		);

		if (cachedId) {
			return cachedId;
		}

		const instance = await tx.combatEncounterParticipantCondition.findFirst({
			select: { id: true },
			where: {
				participantId: input.participantId,
				conditionId: input.conditionId,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return instance?.id ?? null;
	}

	private async findConditionBySlug(slug: string) {
		const condition = await this.prisma.condition.findUnique({
			select: {
				id: true,
				slug: true,
				name: true
			},
			where: { slug }
		});

		if (!condition) {
			throw new NotFoundException(`Состояние "${slug}" не найдено.`);
		}

		return condition;
	}
}
