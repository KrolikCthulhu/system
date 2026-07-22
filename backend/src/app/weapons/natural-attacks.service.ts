import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma, WeaponAttackProfileKind } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import {
	CreateNaturalAttackDto,
	NaturalAttackProfileDto
} from './dto/create-natural-attack.dto';
import { UpdateNaturalAttackDto } from './dto/update-natural-attack.dto';

const referenceSelect = {
	id: true,
	slug: true,
	name: true
} satisfies Prisma.SkillCategorySelect;

const skillOptionSelect = {
	id: true,
	slug: true,
	name: true,
	categoryId: true,
	category: { select: referenceSelect },
	isActive: true,
	sortOrder: true
} satisfies Prisma.SkillSelect;

const characteristicOptionSelect = {
	id: true,
	name: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.CharacteristicSelect;

const combatIntentOptionSelect = {
	id: true,
	slug: true,
	name: true,
	category: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.CombatIntentSelect;

const damageTypeOptionSelect = {
	id: true,
	slug: true,
	name: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.DamageTypeSelect;

const naturalAttackSelect = {
	id: true,
	slug: true,
	name: true,
	skillId: true,
	skill: { select: skillOptionSelect },
	attackProfiles: {
		select: {
			id: true,
			kind: true,
			name: true,
			skillId: true,
			skill: { select: skillOptionSelect },
			characteristicId: true,
			characteristic: { select: characteristicOptionSelect },
			baseCost: true,
			baseDamage: true,
			rangeMeters: true,
			usesAmmo: true,
			canBeParried: true,
			damageTypeLinks: {
				select: {
					damageTypeId: true,
					damageType: { select: damageTypeOptionSelect },
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { damageType: { name: 'asc' } }]
			},
			isActive: true,
			sortOrder: true,
			intentLinks: {
				select: {
					id: true,
					combatIntentId: true,
					combatIntent: { select: combatIntentOptionSelect },
					costModifier: true,
					damageModifier: true,
					ruleText: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { combatIntent: { name: 'asc' } }]
			}
		},
		orderBy: [{ sortOrder: 'asc' }, { kind: 'asc' }]
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.NaturalAttackSelect;

type NaturalAttackRecord = Prisma.NaturalAttackGetPayload<{
	select: typeof naturalAttackSelect;
}>;

@Injectable()
export class NaturalAttacksService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [
			naturalAttacks,
			skills,
			combatIntents,
			characteristics,
			damageTypes
		] = await this.prisma.$transaction([
			this.prisma.naturalAttack.findMany({
				select: naturalAttackSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skill.findMany({
				select: skillOptionSelect,
				orderBy: [
					{ category: { sortOrder: 'asc' } },
					{ sortOrder: 'asc' },
					{ name: 'asc' }
				]
			}),
			this.prisma.combatIntent.findMany({
				select: combatIntentOptionSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.characteristic.findMany({
				select: characteristicOptionSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.damageType.findMany({
				select: damageTypeOptionSelect,
				where: {
					slug: { in: ['rezhuschiy', 'kolyuschiy', 'drobyaschiy'] }
				},
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			naturalAttacks: naturalAttacks.map(item => this.mapNaturalAttack(item)),
			skills,
			characteristics,
			combatIntents,
			damageTypes
		};
	}

	async createNaturalAttack(dto: CreateNaturalAttackDto) {
		const profiles = this.normalizeProfiles(dto.attackProfiles, dto.skillId);
		await this.ensureSkillExists(dto.skillId);
		await this.ensureProfileReferencesExist(profiles);

		try {
			const naturalAttack = await this.prisma.naturalAttack.create({
				select: naturalAttackSelect,
				data: {
					slug: createSlug(dto.name),
					name: dto.name.trim(),
					skillId: dto.skillId,
					isActive: dto.isActive ?? true,
					sortOrder: dto.sortOrder ?? 0,
					attackProfiles: {
						create: profiles.map(profile => this.toProfileCreateData(profile))
					}
				}
			});

			return this.mapNaturalAttack(naturalAttack);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать естественную атаку.', {
				uniqueMessage: 'Естественная атака с таким названием уже существует.'
			});
		}
	}

	async updateNaturalAttack(id: string, dto: UpdateNaturalAttackDto) {
		await this.ensureNaturalAttackExists(id);
		const profiles =
			dto.attackProfiles === undefined
				? undefined
				: this.normalizeProfiles(dto.attackProfiles, dto.skillId);

		if (dto.skillId !== undefined) {
			await this.ensureSkillExists(dto.skillId);
		}
		if (profiles) {
			await this.ensureProfileReferencesExist(profiles);
		}

		try {
			const naturalAttack = await this.prisma.$transaction(async tx => {
				await tx.naturalAttack.update({
					select: { id: true },
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						skillId: dto.skillId,
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (profiles) {
					await tx.naturalAttackProfile.deleteMany({
						where: { naturalAttackId: id }
					});
					for (const profile of profiles) {
						await tx.naturalAttackProfile.create({
							data: {
								...this.toProfileCreateData(profile),
								naturalAttack: { connect: { id } }
							}
						});
					}
				}

				return tx.naturalAttack.findUniqueOrThrow({
					select: naturalAttackSelect,
					where: { id }
				});
			});

			return this.mapNaturalAttack(naturalAttack);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить естественную атаку.', {
				uniqueMessage: 'Естественная атака с таким названием уже существует.'
			});
		}
	}

	async deleteNaturalAttack(id: string) {
		await this.ensureNaturalAttackExists(id);
		await this.prisma.naturalAttack.delete({ where: { id } });
	}

	private normalizeProfiles(
		profiles: NaturalAttackProfileDto[] | undefined,
		skillId?: string
	) {
		const normalizedProfiles =
			profiles && profiles.length
				? profiles
				: skillId
					? [
							{
								kind: 'melee' as const,
								name: 'Ближняя атака',
								skillId,
								baseCost: 1,
								baseDamage: 0,
								rangeMeters: 1,
								usesAmmo: false,
								canBeParried: true,
								isActive: true,
								sortOrder: 0,
								damageTypeIds: [],
								intents: []
							}
						]
					: [];

		if (!normalizedProfiles.length) {
			throw new BadRequestException(
				'Нужно настроить хотя бы один профиль атаки.'
			);
		}

		const kinds = new Set<string>();
		for (const profile of normalizedProfiles) {
			if (kinds.has(profile.kind)) {
				throw new BadRequestException(
					'Для естественной атаки можно настроить только один ближний и один дистанционный профиль.'
				);
			}
			kinds.add(profile.kind);
		}

		return normalizedProfiles;
	}

	private async ensureNaturalAttackExists(id: string) {
		const naturalAttack = await this.prisma.naturalAttack.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!naturalAttack) {
			throw new NotFoundException('Естественная атака не найдена.');
		}
	}

	private async ensureSkillExists(skillId: string) {
		const skill = await this.prisma.skill.findUnique({
			select: { id: true },
			where: { id: skillId }
		});

		if (!skill) {
			throw new BadRequestException('Навык естественной атаки не найден.');
		}
	}

	private async ensureProfileReferencesExist(
		profiles: ReturnType<NaturalAttacksService['normalizeProfiles']>
	) {
		const skillIds = [...new Set(profiles.map(profile => profile.skillId))];
		const characteristicIds = [
			...new Set(
				profiles
					.map(profile => profile.characteristicId)
					.filter((id): id is string => Boolean(id))
			)
		];
		const combatIntentIds = [
			...new Set(
				profiles.flatMap(profile =>
					(profile.intents ?? []).map(intent => intent.combatIntentId)
				)
			)
		];
		const damageTypeIds = [
			...new Set(profiles.flatMap(profile => profile.damageTypeIds ?? []))
		];

		const [skills, characteristics, combatIntents, damageTypes] =
			await this.prisma.$transaction([
				this.prisma.skill.findMany({
					select: { id: true },
					where: { id: { in: skillIds } }
				}),
				this.prisma.characteristic.findMany({
					select: { id: true },
					where: { id: { in: characteristicIds } }
				}),
				this.prisma.combatIntent.findMany({
					select: { id: true },
					where: { id: { in: combatIntentIds } }
				}),
				this.prisma.damageType.findMany({
					select: { id: true },
					where: { id: { in: damageTypeIds } }
				})
			]);

		if (skills.length !== skillIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие навыки.'
			);
		}
		if (characteristics.length !== characteristicIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие характеристики.'
			);
		}
		if (combatIntents.length !== combatIntentIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие боевые намерения.'
			);
		}
		if (damageTypes.length !== damageTypeIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие типы урона.'
			);
		}
	}

	private toProfileCreateData(
		profile: ReturnType<NaturalAttacksService['normalizeProfiles']>[number]
	) {
		return {
			kind:
				profile.kind === 'melee'
					? WeaponAttackProfileKind.MELEE
					: WeaponAttackProfileKind.RANGED,
			name: profile.name.trim() || this.profileKindLabel(profile.kind),
			skill: { connect: { id: profile.skillId } },
			characteristic: profile.characteristicId
				? { connect: { id: profile.characteristicId } }
				: undefined,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo ?? false,
			canBeParried: profile.canBeParried ?? profile.kind === 'melee',
			isActive: profile.isActive ?? true,
			sortOrder: profile.sortOrder ?? 0,
			damageTypeLinks: {
				create: (profile.damageTypeIds ?? []).map((damageTypeId, index) => ({
					damageTypeId,
					sortOrder: index
				}))
			},
			intentLinks: {
				create: (profile.intents ?? []).map((intent, index) => ({
					combatIntentId: intent.combatIntentId,
					costModifier: intent.costModifier ?? 0,
					damageModifier: intent.damageModifier ?? 0,
					ruleText: intent.ruleText?.trim() || null,
					sortOrder: intent.sortOrder ?? index
				}))
			}
		};
	}

	private profileKindLabel(kind: 'melee' | 'ranged') {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	private mapNaturalAttack(naturalAttack: NaturalAttackRecord) {
		return {
			id: naturalAttack.id,
			slug: naturalAttack.slug,
			name: naturalAttack.name,
			skillId: naturalAttack.skillId,
			skill: naturalAttack.skill,
			attackProfiles: naturalAttack.attackProfiles.map(profile => ({
				id: profile.id,
				kind: profile.kind === 'MELEE' ? 'melee' : 'ranged',
				name: profile.name,
				skillId: profile.skillId,
				skill: profile.skill,
				characteristicId: profile.characteristicId,
				characteristic: profile.characteristic,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				canBeParried: profile.canBeParried,
				damageTypes: profile.damageTypeLinks.map(link => link.damageType),
				damageTypeIds: profile.damageTypeLinks.map(link => link.damageTypeId),
				isActive: profile.isActive,
				sortOrder: profile.sortOrder,
				intents: profile.intentLinks.map(link => ({
					id: link.id,
					combatIntentId: link.combatIntentId,
					combatIntent: link.combatIntent,
					costModifier: link.costModifier,
					damageModifier: link.damageModifier,
					ruleText: link.ruleText ?? '',
					sortOrder: link.sortOrder
				}))
			})),
			isActive: naturalAttack.isActive,
			sortOrder: naturalAttack.sortOrder,
			createdAt: naturalAttack.createdAt.toISOString(),
			updatedAt: naturalAttack.updatedAt.toISOString()
		};
	}
}
