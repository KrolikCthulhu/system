import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatActionCheckRuntimeService } from '../combat-action-check-runtime.service';
import {
	CombatDefenseOption,
	CombatResolvedRoll
} from '../domain/combat-action-check.types';
import { CombatEncounterHttpRateLimitService } from '../combat-encounter-http-rate-limit.service';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRealtimeService } from '../combat-encounter-realtime.service';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { RuntimeAction } from '../domain/combat-encounter-runtime.types';
import { CombatEncounterViewService } from '../combat-encounter-view.service';
import { CombatEncounterSnapshot } from '../application/combat-encounter.read-model';
import {
	ExecuteCombatActionActor,
	ExecuteCombatActionInfrastructurePort
} from '../application/execute-combat-action.port';
import {
	PendingCombatDefenseRequest,
	ResolveCombatDefenseInfrastructurePort
} from '../application/resolve-combat-defense.port';
import {
	PendingDeclaredCombatAction,
	ResolveDeclaredCombatActionInfrastructurePort
} from '../application/resolve-declared-combat-action.port';
import { SkipCombatTurnInfrastructurePort } from '../application/skip-combat-turn.port';
import { CombatCommandRepository } from './combat-command.repository';
import { CombatEncounterRepository } from './combat-encounter.repository';
import { CombatEventRepository } from './combat-event.repository';
import { CombatParticipantRepository } from './combat-participant.repository';

@Injectable()
abstract class CombatEncounterActionInfrastructureAdapterBase {
	constructor(
		private readonly actionCheckRuntime: CombatActionCheckRuntimeService,
		private readonly httpRateLimit: CombatEncounterHttpRateLimitService,
		private readonly policy: CombatEncounterPolicyService,
		private readonly runtime: CombatEncounterRuntimeService,
		private readonly view: CombatEncounterViewService,
		private readonly realtime: CombatEncounterRealtimeService,
		private readonly encounters: CombatEncounterRepository,
		private readonly commands: CombatCommandRepository,
		private readonly events: CombatEventRepository,
		private readonly participants: CombatParticipantRepository
	) {
		this.realtime.bindSnapshotResolver((encounterId, recipientUserId) =>
			this.getEncounter(encounterId, recipientUserId)
		);
	}

	async getEncounter(id: string, userId: string) {
		const encounter = await this.findEncounter(id);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);
		return this.view.mapEncounter(encounter, member.role);
	}

	async findActiveActor(input: {
		encounterId: string;
		actorParticipantId: string;
	}): Promise<ExecuteCombatActionActor | null> {
		return this.participants.findActiveActor(input);
	}

	async recordDeclaredAction(input: {
		encounterId: string;
		userId: string;
		actor: ExecuteCombatActionActor;
		targetParticipantId: string | null;
		action: RuntimeAction;
	}) {
		await this.events.recordDeclaredAction(input);
	}

	async resolveActionNow(
		id: string,
		userId: string,
		input: {
			actor: { id: string; currentPotential: number };
			targetParticipantId: string | null;
			action: RuntimeAction;
			declaredActionId?: string;
		}
	) {
		const { actor, targetParticipantId, action, declaredActionId } = input;
		const attackRoll = await this.actionCheckRuntime.rollActionAttack(
			actor.id,
			action
		);
		const defenseOptions = targetParticipantId
			? await this.actionCheckRuntime.resolveDefenseOptions({
					actorParticipantId: actor.id,
					targetParticipantId,
					action
				})
			: [];
		const target = targetParticipantId
			? await this.participants.findDefenseTarget(targetParticipantId)
			: null;
		const shouldRequestPlayerDefense =
			!!attackRoll &&
			!!targetParticipantId &&
			!!target?.playerCharacter &&
			defenseOptions.some(option => option.mode !== 'none');

		if (shouldRequestPlayerDefense) {
			await this.events.requestPlayerDefense({
				encounterId: id,
				userId,
				actor,
				targetParticipantId,
				action,
				attackRoll,
				defenseOptions,
				declaredActionId
			});

			return;
		}

		const automaticDefense = defenseOptions.find(
			option => option.mode !== 'none'
		);
		const defenseRoll = automaticDefense
			? await this.actionCheckRuntime.rollDefense({
					participantId: targetParticipantId ?? actor.id,
					option: automaticDefense
				})
			: null;
		const result = this.runtime.resolveCombatActionResult(
			attackRoll,
			defenseRoll
		);

		await this.events.recordActionExecuted({
			encounterId: id,
			userId,
			actor,
			targetParticipantId,
			action,
			attackRoll,
			defenseRoll,
			defense: automaticDefense ?? null,
			result,
			declaredActionId
		});
	}

	async findPendingDefenseRequest(input: {
		encounterId: string;
		defenseRequestId: string;
	}): Promise<PendingCombatDefenseRequest | null> {
		return this.events.findPendingDefenseRequest(input);
	}

	resolveSelectedDefenseOption(input: {
		options: CombatDefenseOption[];
		mode: 'dodge' | 'parry' | 'none';
		skillSlug?: string | null;
	}) {
		return this.actionCheckRuntime.resolveSelectedDefenseOption(input);
	}

	async resolvePendingDefense(input: {
		encounterId: string;
		userId: string;
		request: PendingCombatDefenseRequest;
		action: RuntimeAction;
		defense: CombatDefenseOption;
		attackRoll: CombatResolvedRoll | null;
		declaredActionId: string | null;
	}) {
		const defenseRoll = await this.actionCheckRuntime.rollDefense({
			participantId: input.request.targetParticipantId,
			option: input.defense
		});
		const result = this.runtime.resolveCombatActionResult(
			input.attackRoll,
			defenseRoll
		);

		await this.events.resolvePendingDefense({
			...input,
			defenseRoll,
			result
		});
	}

	async publishAndReturnEncounter(id: string, userId: string) {
		await this.encounters.incrementStateVersion(id);
		const updatedEncounter = await this.getEncounter(id, userId);
		await this.realtime.publishEncounterUpdated(id);
		return updatedEncounter;
	}

	private assertCombatCommandRateLimit(
		encounterId: string,
		userId: string,
		commandType: string,
		options?: {
			userLimit?: number;
			encounterLimit?: number;
			windowMs?: number;
		}
	) {
		this.httpRateLimit.assertAllowed({
			encounterId,
			userId,
			commandType,
			userLimit: options?.userLimit ?? 30,
			encounterLimit: options?.encounterLimit ?? 120,
			windowMs: options?.windowMs ?? 60_000
		});
	}

	async runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions:
			| {
					userLimit?: number;
					encounterLimit?: number;
					windowMs?: number;
			  }
			| undefined,
		execute: () => Promise<CombatEncounterSnapshot>
	) {
		const existingCommand = await this.commands.findByRequest({
			encounterId,
			userId,
			requestId
		});

		if (existingCommand) {
			return this.getEncounter(encounterId, userId);
		}

		this.assertCombatCommandRateLimit(
			encounterId,
			userId,
			commandType,
			rateLimitOptions
		);

		await this.assertExpectedStateVersion(encounterId, userId, expectedVersion);

		try {
			await this.commands.create({
				encounterId,
				userId,
				requestId,
				commandType
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				return this.getEncounter(encounterId, userId);
			}

			throw error;
		}

		return execute();
	}

	private async assertExpectedStateVersion(
		encounterId: string,
		userId: string,
		expectedVersion: number
	) {
		const encounter = await this.encounters.findStateVersion(encounterId);

		if (!encounter) {
			throw new NotFoundException('Столкновение не найдено.');
		}

		if (encounter.stateVersion === expectedVersion) {
			return;
		}

		throw new ConflictException({
			message:
				'Состояние боя изменилось. Обновите столкновение и повторите действие.',
			code: 'combat_encounter_state_conflict',
			expectedVersion,
			actualVersion: encounter.stateVersion,
			encounter: await this.getEncounter(encounterId, userId)
		});
	}

	async assertEncounterParticipant(encounterId: string, participantId: string) {
		await this.participants.assertActiveParticipant(encounterId, participantId);
	}

	async findEncounter(id: string) {
		return this.encounters.findActiveById(id);
	}

	async recordTurnSkipped(input: {
		encounterId: string;
		participantId: string;
		userId: string;
		participantName: string;
		fromPotential: number;
		toPotential: number;
	}) {
		await this.events.recordTurnSkipped(input);
	}

	async findPendingDeclaredAction(input: {
		encounterId: string;
		declaredActionId: string;
	}): Promise<PendingDeclaredCombatAction | null> {
		return this.events.findPendingDeclaredAction(input);
	}

	async markDeclaredActionResolving(declaredActionId: string) {
		await this.events.markDeclaredActionResolving(declaredActionId);
	}

	async markDeclaredActionPending(declaredActionId: string) {
		await this.events.markDeclaredActionPending(declaredActionId);
	}
}

@Injectable()
export class SkipCombatTurnInfrastructureAdapter
	extends CombatEncounterActionInfrastructureAdapterBase
	implements SkipCombatTurnInfrastructurePort
{
	constructor(
		actionCheckRuntime: CombatActionCheckRuntimeService,
		httpRateLimit: CombatEncounterHttpRateLimitService,
		policy: CombatEncounterPolicyService,
		runtime: CombatEncounterRuntimeService,
		view: CombatEncounterViewService,
		realtime: CombatEncounterRealtimeService,
		encounters: CombatEncounterRepository,
		commands: CombatCommandRepository,
		events: CombatEventRepository,
		participants: CombatParticipantRepository
	) {
		super(
			actionCheckRuntime,
			httpRateLimit,
			policy,
			runtime,
			view,
			realtime,
			encounters,
			commands,
			events,
			participants
		);
	}
}

@Injectable()
export class ExecuteCombatActionInfrastructureAdapter
	extends CombatEncounterActionInfrastructureAdapterBase
	implements ExecuteCombatActionInfrastructurePort
{
	constructor(
		actionCheckRuntime: CombatActionCheckRuntimeService,
		httpRateLimit: CombatEncounterHttpRateLimitService,
		policy: CombatEncounterPolicyService,
		runtime: CombatEncounterRuntimeService,
		view: CombatEncounterViewService,
		realtime: CombatEncounterRealtimeService,
		encounters: CombatEncounterRepository,
		commands: CombatCommandRepository,
		events: CombatEventRepository,
		participants: CombatParticipantRepository
	) {
		super(
			actionCheckRuntime,
			httpRateLimit,
			policy,
			runtime,
			view,
			realtime,
			encounters,
			commands,
			events,
			participants
		);
	}
}

@Injectable()
export class ResolveDeclaredCombatActionInfrastructureAdapter
	extends CombatEncounterActionInfrastructureAdapterBase
	implements ResolveDeclaredCombatActionInfrastructurePort
{
	constructor(
		actionCheckRuntime: CombatActionCheckRuntimeService,
		httpRateLimit: CombatEncounterHttpRateLimitService,
		policy: CombatEncounterPolicyService,
		runtime: CombatEncounterRuntimeService,
		view: CombatEncounterViewService,
		realtime: CombatEncounterRealtimeService,
		encounters: CombatEncounterRepository,
		commands: CombatCommandRepository,
		events: CombatEventRepository,
		participants: CombatParticipantRepository
	) {
		super(
			actionCheckRuntime,
			httpRateLimit,
			policy,
			runtime,
			view,
			realtime,
			encounters,
			commands,
			events,
			participants
		);
	}
}

@Injectable()
export class ResolveCombatDefenseInfrastructureAdapter
	extends CombatEncounterActionInfrastructureAdapterBase
	implements ResolveCombatDefenseInfrastructurePort
{
	constructor(
		actionCheckRuntime: CombatActionCheckRuntimeService,
		httpRateLimit: CombatEncounterHttpRateLimitService,
		policy: CombatEncounterPolicyService,
		runtime: CombatEncounterRuntimeService,
		view: CombatEncounterViewService,
		realtime: CombatEncounterRealtimeService,
		encounters: CombatEncounterRepository,
		commands: CombatCommandRepository,
		events: CombatEventRepository,
		participants: CombatParticipantRepository
	) {
		super(
			actionCheckRuntime,
			httpRateLimit,
			policy,
			runtime,
			view,
			realtime,
			encounters,
			commands,
			events,
			participants
		);
	}
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 'P2002'
	);
}
