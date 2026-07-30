import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AddCreatureParticipantDto } from '../dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from '../dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from '../dto/create-combat-encounter.dto';
import { KnockdownSizeRuleQueryDto } from '../dto/knockdown-size-rule-query.dto';
import { UpdateCombatEncounterDto } from '../dto/update-combat-encounter.dto';
import { UpdateCombatParticipantDto } from '../dto/update-combat-participant.dto';
import { CombatEncounterPolicyService } from '../combat-encounter-policy.service';
import { CombatEncounterRealtimeService } from '../combat-encounter-realtime.service';
import { CombatEncounterViewService } from '../combat-encounter-view.service';
import {
	CombatSizeRuleSize,
	resolveKnockdownSizeRule
} from '../domain/combat-size-rules';
import {
	CampaignMemberRole,
	campaignMemberRoles
} from '../domain/combat-encounter.types';
import {
	COMBAT_ENCOUNTER_REPOSITORY,
	CombatEncounterRepositoryPort
} from './combat-encounter-repository.port';
import {
	COMBAT_PARTICIPANT_REPOSITORY,
	CombatParticipantRepositoryPort
} from './combat-participant-repository.port';

@Injectable()
export class ListCampaignCombatEncountersUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService
	) {}

	async execute(campaignId: string, userId: string) {
		await this.policy.assertCanViewCampaign(campaignId, userId);

		const encounters =
			await this.encounters.findActiveSummariesByCampaign(campaignId);

		return {
			encounters: encounters.map(encounter =>
				this.view.mapEncounterSummary(encounter)
			)
		};
	}
}

@Injectable()
export class CreateCombatEncounterUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService
	) {}

	async execute(
		campaignId: string,
		userId: string,
		dto: CreateCombatEncounterDto
	) {
		await this.policy.assertCanManageCampaign(campaignId, userId);

		const encounter = await this.encounters.createDraft({
			campaignId,
			name: dto.name?.trim() || 'Новое столкновение'
		});

		return this.view.mapEncounter(encounter, campaignMemberRoles.gm);
	}
}

@Injectable()
export class GetCombatEncounterUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService
	) {}

	async execute(id: string, userId: string) {
		const encounter = await this.encounters.findActiveById(id);
		const member = await this.policy.assertCanViewEncounter(userId, encounter);

		return this.view.mapEncounter(encounter, member.role);
	}
}

@Injectable()
export class UpdateCombatEncounterUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	async execute(id: string, userId: string, dto: UpdateCombatEncounterDto) {
		const encounter = await this.encounters.findActiveById(id);
		const member = await this.policy.assertCanManageEncounter(
			userId,
			encounter
		);

		await this.encounters.updateStatus(id, dto);
		await this.encounters.incrementStateVersion(id);

		const updatedEncounter = await this.encounters.findActiveById(id);
		await this.realtime.publishEncounterUpdated(id);

		return this.view.mapEncounter(updatedEncounter, member.role);
	}
}

@Injectable()
export class GetKnockdownSizeRuleUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		@Inject(COMBAT_PARTICIPANT_REPOSITORY)
		private readonly participants: CombatParticipantRepositoryPort,
		private readonly policy: CombatEncounterPolicyService
	) {}

	async execute(id: string, userId: string, query: KnockdownSizeRuleQueryDto) {
		const encounter = await this.encounters.findActiveById(id);
		await this.policy.assertCanViewEncounter(userId, encounter);

		const [attacker, target, defaultSize] = await Promise.all([
			this.participants.findForSizeRule(id, query.attackerParticipantId),
			this.participants.findForSizeRule(id, query.targetParticipantId),
			this.participants.findDefaultSizeForSizeRule()
		]);

		if (!attacker || !target) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		return resolveKnockdownSizeRule(
			this.resolveParticipantSize(attacker, defaultSize),
			this.resolveParticipantSize(target, defaultSize)
		);
	}

	private resolveParticipantSize(
		participant: {
			creatureTier: {
				size: { id: string; name: string; rank: number } | null;
			} | null;
		},
		defaultSize: { id: string; name: string; rank: number } | null
	): CombatSizeRuleSize {
		const size = participant.creatureTier?.size ?? defaultSize;

		return {
			id: size?.id ?? null,
			name: size?.name ?? 'Средний',
			rank: size?.rank ?? 2,
			source: participant.creatureTier?.size ? 'creature_tier' : 'default'
		};
	}
}

@Injectable()
export class AddPlayerCharacterParticipantUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		@Inject(COMBAT_PARTICIPANT_REPOSITORY)
		private readonly participants: CombatParticipantRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	async execute(
		id: string,
		userId: string,
		dto: AddPlayerCharacterParticipantDto
	) {
		const encounter = await this.encounters.findActiveById(id);
		const member = await this.policy.assertCanManageEncounter(
			userId,
			encounter
		);

		await this.participants.addPlayerCharacter({
			encounterId: id,
			campaignId: encounter.campaignId,
			playerCharacterId: dto.playerCharacterId
		});

		return this.publishAndMap(id, member.role);
	}

	private async publishAndMap(id: string, role: CampaignMemberRole) {
		await this.encounters.incrementStateVersion(id);
		const updatedEncounter = await this.encounters.findActiveById(id);
		await this.realtime.publishEncounterUpdated(id);
		return this.view.mapEncounter(updatedEncounter, role);
	}
}

@Injectable()
export class AddCreatureParticipantUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		@Inject(COMBAT_PARTICIPANT_REPOSITORY)
		private readonly participants: CombatParticipantRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	async execute(id: string, userId: string, dto: AddCreatureParticipantDto) {
		const encounter = await this.encounters.findActiveById(id);
		const member = await this.policy.assertCanManageEncounter(
			userId,
			encounter
		);

		await this.participants.addCreatures({
			encounterId: id,
			creatureId: dto.creatureId,
			creatureTierId: dto.creatureTierId,
			count: dto.count ?? 1,
			sceneName: dto.sceneName?.trim()
		});

		return this.publishAndMap(id, member.role);
	}

	private async publishAndMap(id: string, role: CampaignMemberRole) {
		await this.encounters.incrementStateVersion(id);
		const updatedEncounter = await this.encounters.findActiveById(id);
		await this.realtime.publishEncounterUpdated(id);
		return this.view.mapEncounter(updatedEncounter, role);
	}
}

@Injectable()
export class UpdateCombatParticipantUseCase {
	constructor(
		@Inject(COMBAT_ENCOUNTER_REPOSITORY)
		private readonly encounters: CombatEncounterRepositoryPort,
		@Inject(COMBAT_PARTICIPANT_REPOSITORY)
		private readonly participants: CombatParticipantRepositoryPort,
		private readonly policy: CombatEncounterPolicyService,
		private readonly view: CombatEncounterViewService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	async execute(
		id: string,
		participantId: string,
		userId: string,
		dto: UpdateCombatParticipantDto
	) {
		const encounter = await this.encounters.findActiveById(id);
		const member = await this.policy.assertCanManageEncounter(
			userId,
			encounter
		);

		await this.participants.update({
			encounterId: id,
			participantId,
			dto
		});

		return this.publishAndMap(id, member.role);
	}

	private async publishAndMap(id: string, role: CampaignMemberRole) {
		await this.encounters.incrementStateVersion(id);
		const updatedEncounter = await this.encounters.findActiveById(id);
		await this.realtime.publishEncounterUpdated(id);
		return this.view.mapEncounter(updatedEncounter, role);
	}
}
