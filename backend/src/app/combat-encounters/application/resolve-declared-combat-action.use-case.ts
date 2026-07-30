import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { ResolveDeclaredCombatActionDto } from '../dto/execute-combat-action.dto';
import {
	RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE,
	ResolveDeclaredCombatActionInfrastructurePort
} from './resolve-declared-combat-action.port';

@Injectable()
export class ResolveDeclaredCombatActionUseCase {
	constructor(
		@Inject(RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE)
		private readonly infrastructure: ResolveDeclaredCombatActionInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly runtime: CombatEncounterRuntimeService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: ResolveDeclaredCombatActionDto
	) {
		const encounter = await this.infrastructure.findEncounter(encounterId);
		await this.policy.assertCanManageEncounter(userId, encounter);

		const declaredAction = await this.infrastructure.findPendingDeclaredAction({
			encounterId,
			declaredActionId: dto.declaredActionId
		});

		if (!declaredAction) {
			throw new NotFoundException('Заявленное действие не найдено.');
		}

		if (!this.runtime.canResolveDeclaredAction(encounter, declaredAction)) {
			throw new BadRequestException(
				'Это действие еще не дошло до своей точки разрешения.'
			);
		}

		const action = this.runtime.readRuntimeAction(
			declaredAction.actionSnapshot
		);

		if (!action) {
			throw new BadRequestException('В заявке повреждено действие.');
		}

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'resolve_declared_action',
			undefined,
			async () => {
				await this.infrastructure.markDeclaredActionResolving(
					declaredAction.id
				);

				try {
					await this.infrastructure.resolveActionNow(encounterId, userId, {
						actor: declaredAction.actorParticipant,
						targetParticipantId: declaredAction.targetParticipantId,
						action,
						declaredActionId: declaredAction.id
					});
				} catch (error) {
					await this.infrastructure.markDeclaredActionPending(
						declaredAction.id
					);
					throw error;
				}

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
