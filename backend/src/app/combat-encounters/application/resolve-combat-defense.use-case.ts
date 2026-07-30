import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { ResolveCombatDefenseDto } from '../dto/execute-combat-action.dto';
import {
	RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE,
	ResolveCombatDefenseInfrastructurePort
} from './resolve-combat-defense.port';

@Injectable()
export class ResolveCombatDefenseUseCase {
	constructor(
		@Inject(RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE)
		private readonly infrastructure: ResolveCombatDefenseInfrastructurePort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly runtime: CombatEncounterRuntimeService
	) {}

	async execute(
		encounterId: string,
		userId: string,
		dto: ResolveCombatDefenseDto
	) {
		const encounter = await this.infrastructure.findEncounter(encounterId);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);

		const request = await this.infrastructure.findPendingDefenseRequest({
			encounterId,
			defenseRequestId: dto.defenseRequestId
		});

		if (!request) {
			throw new NotFoundException('Запрос защиты не найден.');
		}

		this.policy.assertCanResolveDefense(userId, member, request);

		const action = this.runtime.readRuntimeAction(request.actionSnapshot);

		if (!action) {
			throw new BadRequestException('В запросе защиты повреждено действие.');
		}

		const defenseOptions = this.runtime.readDefenseOptions(
			request.defenseOptions
		);
		const defense = await this.infrastructure.resolveSelectedDefenseOption({
			options: defenseOptions,
			mode: dto.mode,
			skillSlug: dto.skillSlug
		});
		const attackRoll = this.runtime.readResolvedRoll(request.attackRoll);
		const declaredActionId = this.runtime.readDeclaredActionId(
			request.resolution
		);

		return this.infrastructure.runIdempotentCombatCommand(
			encounterId,
			userId,
			dto.requestId,
			dto.expectedVersion,
			'resolve_defense',
			{
				userLimit: 60,
				encounterLimit: 180
			},
			async () => {
				await this.infrastructure.resolvePendingDefense({
					encounterId,
					userId,
					request,
					action,
					defense,
					attackRoll,
					declaredActionId
				});

				return this.infrastructure.publishAndReturnEncounter(
					encounterId,
					userId
				);
			}
		);
	}
}
