import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { coreCombatActionKeys } from '../domain/core-combat-actions';
import { WaitCombatTurnDto } from '../dto/wait-combat-turn.dto';
import {
	WAIT_COMBAT_TURN_INFRASTRUCTURE,
	WaitCombatTurnInfrastructurePort
} from './wait-combat-turn.port';
import { CombatAvailableActionsService } from '../combat-available-actions.service';

@Injectable()
export class WaitCombatTurnUseCase {
	constructor(
		@Inject(WAIT_COMBAT_TURN_INFRASTRUCTURE)
		private readonly infrastructure: WaitCombatTurnInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly availableActions: CombatAvailableActionsService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: WaitCombatTurnDto
	) {
		if (dto.actionSlug !== coreCombatActionKeys.waitUntilAfterParticipant) {
			throw new BadRequestException('Неизвестное системное действие.');
		}

		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);
		const participant = encounter.participants.find(
			item => item.id === dto.actorParticipantId
		);
		const targetParticipant = encounter.participants.find(
			item => item.id === dto.targetParticipantId
		);

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		if (!targetParticipant) {
			throw new NotFoundException('Цель ожидания не найдена.');
		}

		this.policy.assertCanControlParticipant(userId, member, participant);

		const actions = await this.availableActions.buildForParticipant(
			encounter,
			participant,
			member.role,
			userId
		);
		const waitAction = actions.systemActions.find(
			action => action.actionSlug === dto.actionSlug
		);
		const waitTarget = waitAction?.availableTargets.find(
			target => target.participantId === dto.targetParticipantId
		);

		if (!waitAction?.isAvailable) {
			throw new ForbiddenException(
				waitAction?.disabledReason ?? 'Действие недоступно.'
			);
		}

		if (!waitTarget?.isAvailable || waitTarget.potentialCost === null) {
			throw new BadRequestException(
				waitTarget?.disabledReason ?? 'Нельзя выждать после этой цели.'
			);
		}

		const nextPotential = Math.max(0, targetParticipant.currentPotential - 1);

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'wait_until_after_participant',
			undefined,
			async () => {
				await this.infrastructure.recordInitiativeWaited({
					encounterId,
					participantId: participant.id,
					targetParticipantId: targetParticipant.id,
					userId,
					participantName: participant.sceneName,
					targetParticipantName: targetParticipant.sceneName,
					fromPotential: participant.currentPotential,
					toPotential: nextPotential,
					potentialCost: waitTarget.potentialCost
				});

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
