import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
	CampaignMemberRole,
	CampaignMemberStatus,
	campaignMemberRoles,
	campaignMemberStatuses,
	CombatEncounterStatus
} from './domain/combat-encounter.types';

export interface CombatEncounterPolicyEncounter {
	campaignId: string;
	status?: CombatEncounterStatus;
}

export interface CombatEncounterPolicyParticipant {
	playerCharacter?: {
		ownerUser?: {
			id: string;
		} | null;
		ownerUserId?: string | null;
	} | null;
}

export interface CombatEncounterPolicyDefenseRequest {
	targetParticipant: CombatEncounterPolicyParticipant;
}

export interface CombatEncounterPolicyMember {
	role: CampaignMemberRole;
	status: CampaignMemberStatus;
}

@Injectable()
export class CombatEncounterPolicyService {
	constructor(private readonly prisma: PrismaService) {}

	async assertCanViewCampaign(campaignId: string, userId: string) {
		return this.getActiveCampaignMember(campaignId, userId);
	}

	async assertCanManageCampaign(campaignId: string, userId: string) {
		const member = await this.getActiveCampaignMember(campaignId, userId);
		this.assertGm(member);
		return member;
	}

	async assertCanViewEncounter(
		userId: string,
		encounter: CombatEncounterPolicyEncounter
	) {
		return this.getActiveCampaignMember(encounter.campaignId, userId);
	}

	async assertCanManageEncounter(
		userId: string,
		encounter: CombatEncounterPolicyEncounter
	) {
		const member = await this.assertCanViewEncounter(userId, encounter);
		this.assertGm(member);
		return member;
	}

	assertCanControlParticipant(
		userId: string,
		member: CombatEncounterPolicyMember,
		participant: CombatEncounterPolicyParticipant
	) {
		if (
			member.role !== campaignMemberRoles.gm &&
			!this.isPlayerCharacterOwner(userId, participant)
		) {
			throw new ForbiddenException('Недостаточно прав для этого действия.');
		}
	}

	assertCanResolveDefense(
		userId: string,
		member: CombatEncounterPolicyMember,
		request: CombatEncounterPolicyDefenseRequest
	) {
		if (
			member.role !== campaignMemberRoles.gm &&
			!this.isPlayerCharacterOwner(userId, request.targetParticipant)
		) {
			throw new ForbiddenException('Недостаточно прав для этого действия.');
		}
	}

	assertCanExecuteAction(member: CombatEncounterPolicyMember) {
		this.assertGm(member);
	}

	private async getActiveCampaignMember(campaignId: string, userId: string) {
		const member = await this.prisma.campaignMember.findUnique({
			select: { role: true, status: true },
			where: {
				campaignId_userId: {
					campaignId,
					userId
				}
			}
		});

		if (!member || member.status !== campaignMemberStatuses.active) {
			throw new ForbiddenException('Вы не состоите в этой кампании.');
		}

		return member;
	}

	private assertGm(member: CombatEncounterPolicyMember) {
		if (member.role !== campaignMemberRoles.gm) {
			throw new ForbiddenException(
				'Действие доступно только мастеру кампании.'
			);
		}
	}

	private isPlayerCharacterOwner(
		userId: string,
		participant: CombatEncounterPolicyParticipant
	) {
		return (
			participant.playerCharacter?.ownerUser?.id === userId ||
			participant.playerCharacter?.ownerUserId === userId
		);
	}
}
