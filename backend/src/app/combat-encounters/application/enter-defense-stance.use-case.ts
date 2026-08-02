import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatAvailableActionsService } from '../combat-available-actions.service';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { coreCombatActionKeys } from '../domain/core-combat-actions';
import { EnterDefenseStanceDto } from '../dto/enter-defense-stance.dto';
import {
	ENTER_DEFENSE_STANCE_INFRASTRUCTURE,
	EnterDefenseStanceInfrastructurePort
} from './enter-defense-stance.port';

@Injectable()
export class EnterDefenseStanceUseCase {
	constructor(
		@Inject(ENTER_DEFENSE_STANCE_INFRASTRUCTURE)
		private readonly infrastructure: EnterDefenseStanceInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly availableActions: CombatAvailableActionsService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: EnterDefenseStanceDto
	) {
		if (dto.actionSlug !== coreCombatActionKeys.enterDefenseStance) {
			throw new BadRequestException('Неизвестное системное действие.');
		}

		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);
		const participant = encounter.participants.find(
			item => item.id === dto.actorParticipantId
		);

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		this.policy.assertCanControlParticipant(userId, member, participant);

		const actions = await this.availableActions.buildForParticipant(
			encounter,
			participant,
			member.role,
			userId
		);
		const defenseAction = actions.systemActions.find(
			action => action.actionSlug === dto.actionSlug
		);

		if (!defenseAction?.isAvailable) {
			throw new ForbiddenException(
				defenseAction?.disabledReason ?? 'Действие недоступно.'
			);
		}

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'enter_defense_stance',
			undefined,
			async () => {
				await this.infrastructure.recordDefenseStanceEntered({
					encounterId,
					participantId: participant.id,
					userId,
					participantName: participant.sceneName,
					round: encounter.currentRound,
					preservedPotential: participant.currentPotential
				});

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
