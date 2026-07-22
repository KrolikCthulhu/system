import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {
	CampaignMemberRole,
	CampaignMemberStatus,
	Prisma
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { InviteCampaignMemberDto } from './dto/invite-campaign-member.dto';

const campaignSelect = {
	id: true,
	name: true,
	description: true,
	ownerId: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	owner: {
		select: {
			id: true,
			username: true,
			displayUsername: true,
			email: true
		}
	},
	members: {
		select: {
			id: true,
			role: true,
			status: true,
			invitedAt: true,
			joinedAt: true,
			user: {
				select: {
					id: true,
					username: true,
					displayUsername: true,
					email: true
				}
			}
		},
		orderBy: [{ role: 'asc' }, { invitedAt: 'asc' }]
	}
} satisfies Prisma.CampaignSelect;

type CampaignRecord = Prisma.CampaignGetPayload<{
	select: typeof campaignSelect;
}>;

@Injectable()
export class CampaignsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCampaigns(userId: string) {
		const campaigns = await this.prisma.campaign.findMany({
			select: campaignSelect,
			where: {
				isActive: true,
				members: {
					some: {
						userId,
						status: {
							not: CampaignMemberStatus.LEFT
						}
					}
				}
			},
			orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }]
		});

		return {
			campaigns: campaigns.map(campaign => this.mapCampaign(campaign, userId))
		};
	}

	async createCampaign(userId: string, dto: CreateCampaignDto) {
		const campaign = await this.prisma.$transaction(async tx => {
			const createdCampaign = await tx.campaign.create({
				select: { id: true },
				data: {
					name: dto.name.trim(),
					description: normalizeOptionalString(dto.description),
					ownerId: userId
				}
			});

			await tx.campaignMember.create({
				data: {
					campaignId: createdCampaign.id,
					userId,
					role: CampaignMemberRole.GM,
					status: CampaignMemberStatus.ACTIVE,
					invitedById: userId,
					joinedAt: new Date()
				}
			});

			return tx.campaign.findUniqueOrThrow({
				select: campaignSelect,
				where: { id: createdCampaign.id }
			});
		});

		return this.mapCampaign(campaign, userId);
	}

	async inviteMember(
		campaignId: string,
		inviterId: string,
		dto: InviteCampaignMemberDto
	) {
		await this.assertCampaignGm(campaignId, inviterId);

		const invitee = await this.findUserByIdentifier(dto.identifier);

		if (!invitee) {
			throw new NotFoundException('Пользователь не найден.');
		}

		if (invitee.id === inviterId) {
			throw new ConflictException('Вы уже состоите в этой кампании.');
		}

		const role = dto.role ?? CampaignMemberRole.PLAYER;
		const existingMember = await this.prisma.campaignMember.findUnique({
			select: { id: true, status: true },
			where: {
				campaignId_userId: {
					campaignId,
					userId: invitee.id
				}
			}
		});

		if (existingMember && existingMember.status !== CampaignMemberStatus.LEFT) {
			throw new ConflictException('Пользователь уже приглашён в кампанию.');
		}

		if (existingMember) {
			await this.prisma.campaignMember.update({
				where: { id: existingMember.id },
				data: {
					role,
					status: CampaignMemberStatus.INVITED,
					invitedById: inviterId,
					invitedAt: new Date(),
					joinedAt: null
				}
			});
		} else {
			await this.prisma.campaignMember.create({
				data: {
					campaignId,
					userId: invitee.id,
					role,
					status: CampaignMemberStatus.INVITED,
					invitedById: inviterId
				}
			});
		}

		return this.getCampaignForMember(campaignId, inviterId);
	}

	async acceptInvitation(campaignId: string, userId: string) {
		const member = await this.prisma.campaignMember.findUnique({
			select: { id: true, status: true },
			where: {
				campaignId_userId: {
					campaignId,
					userId
				}
			}
		});

		if (!member) {
			throw new NotFoundException('Приглашение не найдено.');
		}

		if (member.status === CampaignMemberStatus.LEFT) {
			throw new ForbiddenException('Вы вышли из этой кампании.');
		}

		if (member.status === CampaignMemberStatus.INVITED) {
			await this.prisma.campaignMember.update({
				where: { id: member.id },
				data: {
					status: CampaignMemberStatus.ACTIVE,
					joinedAt: new Date()
				}
			});
		}

		return this.getCampaignForMember(campaignId, userId);
	}

	async leaveCampaign(campaignId: string, userId: string) {
		const campaign = await this.getCampaignForMember(campaignId, userId);

		if (campaign.owner.id === userId) {
			throw new ConflictException('Владелец кампании не может выйти из неё.');
		}

		await this.prisma.campaignMember.update({
			where: {
				campaignId_userId: {
					campaignId,
					userId
				}
			},
			data: {
				status: CampaignMemberStatus.LEFT
			}
		});
	}

	private async getCampaignForMember(campaignId: string, userId: string) {
		const campaign = await this.prisma.campaign.findFirst({
			select: campaignSelect,
			where: {
				id: campaignId,
				isActive: true,
				members: {
					some: {
						userId,
						status: {
							not: CampaignMemberStatus.LEFT
						}
					}
				}
			}
		});

		if (!campaign) {
			throw new NotFoundException('Кампания не найдена.');
		}

		return this.mapCampaign(campaign, userId);
	}

	private async assertCampaignGm(campaignId: string, userId: string) {
		const member = await this.prisma.campaignMember.findUnique({
			select: { role: true, status: true },
			where: {
				campaignId_userId: {
					campaignId,
					userId
				}
			}
		});

		if (
			!member ||
			member.status !== CampaignMemberStatus.ACTIVE ||
			member.role !== CampaignMemberRole.GM
		) {
			throw new ForbiddenException(
				'Недостаточно прав для управления кампанией.'
			);
		}
	}

	private findUserByIdentifier(identifier: string) {
		const value = identifier.trim();

		return this.prisma.user.findFirst({
			select: {
				id: true
			},
			where: {
				OR: [
					{
						email: {
							equals: value,
							mode: 'insensitive'
						}
					},
					{
						username: {
							equals: value,
							mode: 'insensitive'
						}
					}
				],
				isActive: true
			}
		});
	}

	private mapCampaign(campaign: CampaignRecord, currentUserId: string) {
		const currentMember = campaign.members.find(
			member => member.user.id === currentUserId
		);

		return {
			id: campaign.id,
			name: campaign.name,
			description: campaign.description,
			owner: mapCampaignUser(campaign.owner),
			currentUserRole: currentMember?.role ?? null,
			currentUserStatus: currentMember?.status ?? null,
			isActive: campaign.isActive,
			members: campaign.members.map(member => ({
				id: member.id,
				role: member.role,
				status: member.status,
				invitedAt: member.invitedAt.toISOString(),
				joinedAt: member.joinedAt?.toISOString() ?? null,
				user: mapCampaignUser(member.user)
			})),
			createdAt: campaign.createdAt.toISOString(),
			updatedAt: campaign.updatedAt.toISOString()
		};
	}
}

function normalizeOptionalString(value: string | undefined) {
	const normalized = value?.trim();
	return normalized ? normalized : null;
}

function mapCampaignUser(user: CampaignRecord['owner']) {
	return {
		id: user.id,
		username: user.username,
		displayUsername: user.displayUsername,
		email: user.email
	};
}
