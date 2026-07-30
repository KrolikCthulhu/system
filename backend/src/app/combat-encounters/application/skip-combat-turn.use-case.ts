import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { combatEncounterStatuses } from '../domain/combat-encounter.types';
import { SkipCombatTurnDto } from '../dto/skip-combat-turn.dto';
import {
	SKIP_COMBAT_TURN_INFRASTRUCTURE,
	SkipCombatTurnInfrastructurePort
} from './skip-combat-turn.port';

@Injectable()
export class SkipCombatTurnUseCase {
	constructor(
		@Inject(SKIP_COMBAT_TURN_INFRASTRUCTURE)
		private readonly infrastructure: SkipCombatTurnInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly runtime: CombatEncounterRuntimeService
	) {}

	async execute(
		encounterId: string,
		participantId: string,
		userId: string,
		dto: SkipCombatTurnDto
	) {
		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);

		if (encounter.status !== combatEncounterStatuses.active) {
			throw new BadRequestException('Пропуск хода доступен только в бою.');
		}

		const participant = encounter.participants.find(
			item => item.id === participantId
		);

		if (!participant || !participant.isActive) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		this.policy.assertCanControlParticipant(userId, member, participant);

		if (
			encounter.declaredActions.some(
				action =>
					action.status === 'pending' &&
					this.runtime.canResolveDeclaredAction(encounter, action)
			)
		) {
			throw new BadRequestException(
				'Сначала нужно разыграть заявленное действие.'
			);
		}

		const activeParticipant = this.runtime.resolveActiveParticipant(encounter);

		if (!activeParticipant || activeParticipant.id !== participantId) {
			throw new BadRequestException('Сейчас ход другого участника.');
		}

		const nextPotential = this.runtime.resolvePotentialAfterSkip(
			encounter,
			participantId
		);

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'skip_turn',
			undefined,
			async () => {
				await this.infrastructure.recordTurnSkipped({
					encounterId,
					participantId,
					userId,
					participantName: participant.sceneName,
					fromPotential: participant.currentPotential,
					toPotential: nextPotential
				});

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
