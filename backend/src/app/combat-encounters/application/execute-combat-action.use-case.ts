import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { ExecuteCombatActionDto } from '../dto/execute-combat-action.dto';
import {
	EXECUTE_COMBAT_ACTION_INFRASTRUCTURE,
	ExecuteCombatActionInfrastructurePort
} from './execute-combat-action.port';

@Injectable()
export class ExecuteCombatActionUseCase {
	constructor(
		@Inject(EXECUTE_COMBAT_ACTION_INFRASTRUCTURE)
		private readonly infrastructure: ExecuteCombatActionInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly runtime: CombatEncounterRuntimeService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: ExecuteCombatActionDto
	) {
		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);
		this.policy.assertCanExecuteAction(member);

		const actor = await this.infrastructure.findActiveActor({
			encounterId,
			actorParticipantId: dto.actorParticipantId
		});

		if (!actor) {
			throw new NotFoundException('Исполнитель действия не найден.');
		}

		const action = this.runtime.findParticipantAction(actor, dto.actionSlug);

		if (!action || action.isActive === false) {
			throw new NotFoundException('Действие участника не найдено.');
		}

		const targetParticipantId =
			action.target?.type === 'self'
				? actor.id
				: (dto.targetParticipantId ?? null);

		if (
			this.runtime.actionRequiresSelectedTarget(action) &&
			!targetParticipantId
		) {
			throw new BadRequestException('Для действия нужно выбрать цель.');
		}

		if (targetParticipantId) {
			await this.infrastructure.assertEncounterParticipant(
				encounterId,
				targetParticipantId
			);
		}

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'execute_action',
			undefined,
			async () => {
				if (
					this.runtime.resolveCampaignActionResolutionMode(encounter) ===
					'delayed'
				) {
					await this.infrastructure.recordDeclaredAction({
						encounterId,
						userId,
						actor,
						targetParticipantId,
						action
					});

					return this.infrastructure.publishAndReturnEncounter(
						encounterId,
						userId
					);
				}

				await this.infrastructure.resolveActionNow(encounterId, userId, {
					actor,
					targetParticipantId,
					action
				});

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
