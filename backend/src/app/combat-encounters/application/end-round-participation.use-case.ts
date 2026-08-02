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
import { EndRoundParticipationDto } from '../dto/end-round-participation.dto';
import {
	END_ROUND_PARTICIPATION_INFRASTRUCTURE,
	EndRoundParticipationInfrastructurePort
} from './end-round-participation.port';

@Injectable()
export class EndRoundParticipationUseCase {
	constructor(
		@Inject(END_ROUND_PARTICIPATION_INFRASTRUCTURE)
		private readonly infrastructure: EndRoundParticipationInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly availableActions: CombatAvailableActionsService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: EndRoundParticipationDto
	) {
		if (dto.actionSlug !== coreCombatActionKeys.endRoundParticipation) {
			throw new BadRequestException('Неизвестное системное действие.');
		}

		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanManageEncounter(
			userId,
			encounter
		);
		const participant = encounter.participants.find(
			item => item.id === dto.actorParticipantId
		);

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		const actions = await this.availableActions.buildForParticipant(
			encounter,
			participant,
			member.role,
			userId
		);
		const endRoundAction = actions.systemActions.find(
			action => action.actionSlug === dto.actionSlug
		);

		if (!endRoundAction?.isAvailable) {
			throw new ForbiddenException(
				endRoundAction?.disabledReason ?? 'Действие недоступно.'
			);
		}

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'end_round_participation',
			undefined,
			async () => {
				await this.infrastructure.recordRoundParticipationEnded({
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
