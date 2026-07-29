import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {
	CampaignMemberRole,
	CampaignMemberStatus,
	PlayerCharacterStatus,
	Prisma
} from '@prisma/generated';
import { CharacterSheetRuntimeService } from '../character-sheet/character-sheet-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerCharacterDto } from './dto/create-player-character.dto';
import { RollPlayerCharacterSkillDto } from './dto/roll-player-character-skill.dto';
import { UpdatePlayerCharacterSheetDto } from './dto/update-player-character-sheet.dto';
import { UpdatePlayerCharacterDto } from './dto/update-player-character.dto';

const playerCharacterSelect = {
	id: true,
	campaignId: true,
	ownerUserId: true,
	name: true,
	status: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	ownerUser: {
		select: {
			id: true,
			username: true,
			displayUsername: true,
			email: true
		}
	},
	sheetInputValues: true,
	campaign: {
		select: {
			id: true,
			name: true
		}
	}
} satisfies Prisma.PlayerCharacterSelect;

const playerCharacterSummarySelect = {
	id: true,
	campaignId: true,
	ownerUserId: true,
	name: true,
	status: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	ownerUser: {
		select: {
			id: true,
			username: true,
			displayUsername: true,
			email: true
		}
	},
	campaign: {
		select: {
			id: true,
			name: true
		}
	}
} satisfies Prisma.PlayerCharacterSelect;

type PlayerCharacterRecord = Prisma.PlayerCharacterGetPayload<{
	select: typeof playerCharacterSelect;
}>;
type PlayerCharacterSummaryRecord = Prisma.PlayerCharacterGetPayload<{
	select: typeof playerCharacterSummarySelect;
}>;

@Injectable()
export class PlayerCharactersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sheetRuntime: CharacterSheetRuntimeService
	) {}

	async getCampaignCharacters(campaignId: string, userId: string) {
		const member = await this.getActiveCampaignMember(campaignId, userId);

		const characters = await this.prisma.playerCharacter.findMany({
			select: playerCharacterSummarySelect,
			where: {
				campaignId,
				isActive: true,
				...(member.role === CampaignMemberRole.GM
					? {}
					: { ownerUserId: userId })
			},
			orderBy: [{ createdAt: 'asc' }, { name: 'asc' }]
		});

		return {
			characters: characters.map(character =>
				this.mapCharacterSummary(character)
			)
		};
	}

	async createCharacter(
		campaignId: string,
		userId: string,
		dto: CreatePlayerCharacterDto
	) {
		await this.getActiveCampaignMember(campaignId, userId);

		const character = await this.prisma.playerCharacter.create({
			select: playerCharacterSelect,
			data: {
				campaignId,
				ownerUserId: userId,
				name: dto.name.trim(),
				status: PlayerCharacterStatus.DRAFT
			}
		});

		return this.mapCharacter(character);
	}

	async getCharacter(id: string, userId: string) {
		const character = await this.findVisibleCharacter(id, userId);
		return this.mapCharacter(character);
	}

	async updateCharacter(
		id: string,
		userId: string,
		dto: UpdatePlayerCharacterDto
	) {
		const character = await this.findVisibleCharacter(id, userId);

		if (character.ownerUserId !== userId) {
			throw new ForbiddenException(
				'Редактировать персонажа может только владелец.'
			);
		}

		const updatedCharacter = await this.prisma.playerCharacter.update({
			select: playerCharacterSelect,
			where: { id },
			data: {
				name: dto.name === undefined ? undefined : dto.name.trim()
			}
		});

		return this.mapCharacter(updatedCharacter);
	}

	async getCharacterSheet(id: string, userId: string) {
		const character = await this.findVisibleCharacter(id, userId);

		return {
			inputValues: await this.sheetRuntime.createInitialInputValues(
				this.sheetRuntime.normalizeInputValues(character.sheetInputValues)
			)
		};
	}

	async updateCharacterSheet(
		id: string,
		userId: string,
		dto: UpdatePlayerCharacterSheetDto
	) {
		const character = await this.findVisibleCharacter(id, userId);

		this.assertCanEditCharacter(character, userId);

		const inputValues = this.sheetRuntime.normalizeInputValues(
			dto.inputValues ?? {}
		);
		const updatedCharacter = await this.prisma.playerCharacter.update({
			select: playerCharacterSelect,
			where: { id },
			data: {
				sheetInputValues: inputValues
			}
		});

		return {
			inputValues: await this.sheetRuntime.createInitialInputValues(
				this.sheetRuntime.normalizeInputValues(
					updatedCharacter.sheetInputValues
				)
			)
		};
	}

	async rollSkill(
		id: string,
		userId: string,
		dto: RollPlayerCharacterSkillDto
	) {
		const character = await this.findVisibleCharacter(id, userId);

		this.assertCanEditCharacter(character, userId);

		const result = await this.sheetRuntime.rollSkill(
			dto.skillId,
			dto.inputValues ??
				this.sheetRuntime.normalizeInputValues(character.sheetInputValues)
		);
		const updatedCharacter = await this.prisma.playerCharacter.update({
			select: playerCharacterSelect,
			where: { id },
			data: {
				sheetInputValues: result.inputValues
			}
		});

		return {
			inputValues: await this.sheetRuntime.createInitialInputValues(
				this.sheetRuntime.normalizeInputValues(
					updatedCharacter.sheetInputValues
				)
			),
			roll: result.roll
		};
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

		if (!member || member.status !== CampaignMemberStatus.ACTIVE) {
			throw new ForbiddenException('Вы не состоите в этой кампании.');
		}

		return member;
	}

	private async findVisibleCharacter(id: string, userId: string) {
		const character = await this.prisma.playerCharacter.findUnique({
			select: playerCharacterSelect,
			where: { id }
		});

		if (!character || !character.isActive) {
			throw new NotFoundException('Персонаж не найден.');
		}

		const member = await this.getActiveCampaignMember(
			character.campaignId,
			userId
		);

		if (
			member.role !== CampaignMemberRole.GM &&
			character.ownerUserId !== userId
		) {
			throw new ForbiddenException(
				'Недостаточно прав для просмотра персонажа.'
			);
		}

		return character;
	}

	private assertCanEditCharacter(
		character: PlayerCharacterRecord,
		userId: string
	) {
		if (character.ownerUserId !== userId) {
			throw new ForbiddenException(
				'Редактировать персонажа может только владелец.'
			);
		}
	}

	private mapCharacter(character: PlayerCharacterRecord) {
		return this.mapCharacterSummary(character);
	}

	private mapCharacterSummary(character: PlayerCharacterSummaryRecord) {
		return {
			id: character.id,
			campaignId: character.campaignId,
			campaignName: character.campaign.name,
			ownerUserId: character.ownerUserId,
			owner: {
				id: character.ownerUser.id,
				username: character.ownerUser.username,
				displayUsername: character.ownerUser.displayUsername,
				email: character.ownerUser.email
			},
			name: character.name,
			status: character.status,
			isActive: character.isActive,
			createdAt: character.createdAt.toISOString(),
			updatedAt: character.updatedAt.toISOString()
		};
	}
}
