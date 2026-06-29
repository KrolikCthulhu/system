import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateCreatureDto } from './dto/create-creature.dto';
import { CreatureTierDto } from './dto/creature-tier.dto';
import { UpdateCreatureDto } from './dto/update-creature.dto';

const creatureSelect = {
	id: true,
	slug: true,
	name: true,
	typeId: true,
	type: {
		select: {
			id: true,
			slug: true,
			name: true
		}
	},
	tiers: {
		select: {
			id: true,
			tier: true,
			name: true,
			hp: true,
			armorPresetId: true,
			armorPreset: {
				select: {
					id: true,
					slug: true,
					name: true,
					points: true,
					protection: true
				}
			},
			skills: {
				select: {
					id: true,
					skillId: true,
					level: true,
					skill: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					}
				},
				orderBy: [{ skill: { name: 'asc' } }]
			},
			characteristics: {
				select: {
					id: true,
					characteristicId: true,
					value: true,
					characteristic: {
						select: {
							id: true,
							name: true,
							minValue: true,
							maxValue: true,
							defaultValue: true,
							isActive: true,
							sortOrder: true
						}
					}
				},
				orderBy: [{ characteristic: { sortOrder: 'asc' } }]
			},
			isActive: true,
			sortOrder: true
		},
		orderBy: [{ tier: 'asc' }]
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.CreatureSelect;

type CreatureRecord = Prisma.CreatureGetPayload<{
	select: typeof creatureSelect;
}>;

@Injectable()
export class CreaturesService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [creatures, creatureTypes, armorPresets, skills, characteristics] =
			await this.prisma.$transaction([
				this.prisma.creature.findMany({
					select: creatureSelect,
					orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
				}),
				this.prisma.creatureType.findMany({
					select: {
						id: true,
						slug: true,
						name: true,
						isActive: true,
						sortOrder: true
					},
					orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
				}),
				this.prisma.armorPreset.findMany({
					select: {
						id: true,
						slug: true,
						name: true,
						points: true,
						protection: true,
						isActive: true,
						sortOrder: true
					},
					orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
				}),
				this.prisma.skill.findMany({
					select: {
						id: true,
						slug: true,
						name: true,
						categoryId: true,
						rollCharacteristicId: true,
						category: {
							select: {
								id: true,
								slug: true,
								name: true
							}
						},
						maxLevel: true,
						isActive: true,
						sortOrder: true
					},
					orderBy: [
						{ category: { sortOrder: 'asc' } },
						{ sortOrder: 'asc' },
						{ name: 'asc' }
					]
				}),
				this.prisma.characteristic.findMany({
					select: {
						id: true,
						name: true,
						minValue: true,
						maxValue: true,
						defaultValue: true,
						isActive: true,
						sortOrder: true
					},
					orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
				})
			]);

		return {
			creatures: creatures.map(item => this.mapCreature(item)),
			creatureTypes,
			armorPresets,
			skills,
			characteristics
		};
	}

	async createCreature(dto: CreateCreatureDto) {
		await this.ensureReferences(dto.typeId, dto.tiers);

		try {
			const creature = await this.prisma.creature.create({
				select: creatureSelect,
				data: {
					slug: createSlug(dto.name),
					name: dto.name.trim(),
					typeId: dto.typeId,
					isActive: dto.isActive ?? true,
					sortOrder: dto.sortOrder ?? 0,
					tiers: {
						create: dto.tiers.map(tier => this.toTierCreateData(tier))
					}
				}
			});

			return this.mapCreature(creature);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать существо.', {
				uniqueMessage: 'Существо с таким названием уже существует.'
			});
		}
	}

	async updateCreature(id: string, dto: UpdateCreatureDto) {
		await this.ensureCreatureExists(id);
		await this.ensureReferences(dto.typeId, dto.tiers ?? []);

		try {
			const creature = await this.prisma.$transaction(async tx => {
				await tx.creature.update({
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						typeId: dto.typeId,
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (dto.tiers) {
					await tx.creatureTier.deleteMany({ where: { creatureId: id } });

					for (const tier of dto.tiers) {
						await tx.creatureTier.create({
							data: {
								...this.toTierCreateData(tier),
								creatureId: id
							}
						});
					}
				}

				return tx.creature.findUniqueOrThrow({
					select: creatureSelect,
					where: { id }
				});
			});

			return this.mapCreature(creature);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить существо.', {
				uniqueMessage: 'Существо с таким названием уже существует.'
			});
		}
	}

	async deleteCreature(id: string) {
		await this.ensureCreatureExists(id);
		await this.prisma.creature.delete({ where: { id } });
	}

	private async ensureCreatureExists(id: string) {
		const creature = await this.prisma.creature.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!creature) {
			throw new NotFoundException('Существо не найдено.');
		}
	}

	private async ensureReferences(
		typeId: string | undefined,
		tiers: CreatureTierDto[]
	) {
		if (typeId) {
			const type = await this.prisma.creatureType.findUnique({
				select: { id: true },
				where: { id: typeId }
			});

			if (!type) {
				throw new BadRequestException('Тип существа не найден.');
			}
		}

		const armorPresetIds = [
			...new Set(
				tiers
					.map(tier => tier.armorPresetId)
					.filter((id): id is string => Boolean(id))
			)
		];
		const skillIds = [
			...new Set(tiers.flatMap(tier => tier.skills.map(skill => skill.skillId)))
		];
		const characteristicIds = [
			...new Set(
				tiers.flatMap(tier =>
					tier.characteristics.map(
						characteristic => characteristic.characteristicId
					)
				)
			)
		];

		if (armorPresetIds.length) {
			const count = await this.prisma.armorPreset.count({
				where: { id: { in: armorPresetIds } }
			});

			if (count !== armorPresetIds.length) {
				throw new BadRequestException('Пресет брони не найден.');
			}
		}

		if (skillIds.length) {
			const count = await this.prisma.skill.count({
				where: { id: { in: skillIds } }
			});

			if (count !== skillIds.length) {
				throw new BadRequestException('Навык не найден.');
			}
		}

		if (characteristicIds.length) {
			const count = await this.prisma.characteristic.count({
				where: { id: { in: characteristicIds } }
			});

			if (count !== characteristicIds.length) {
				throw new BadRequestException('Характеристика не найдена.');
			}
		}
	}

	private toTierCreateData(tier: CreatureTierDto) {
		return {
			tier: tier.tier,
			name: tier.name.trim(),
			hp: tier.hp,
			armorPresetId: tier.armorPresetId ?? null,
			isActive: tier.isActive ?? true,
			sortOrder: tier.sortOrder ?? tier.tier,
			skills: {
				create: tier.skills.map(skill => ({
					skillId: skill.skillId,
					level: skill.level
				}))
			},
			characteristics: {
				create: tier.characteristics.map(characteristic => ({
					characteristicId: characteristic.characteristicId,
					value: characteristic.value
				}))
			}
		};
	}

	private mapCreature(creature: CreatureRecord) {
		return {
			id: creature.id,
			slug: creature.slug,
			name: creature.name,
			typeId: creature.typeId,
			type: creature.type,
			tiers: creature.tiers.map(tier => ({
				id: tier.id,
				tier: tier.tier,
				name: tier.name,
				hp: tier.hp,
				armorPresetId: tier.armorPresetId,
				armorPreset: tier.armorPreset,
				skills: tier.skills.map(skill => ({
					id: skill.id,
					skillId: skill.skillId,
					level: skill.level,
					skill: skill.skill
				})),
				characteristics: tier.characteristics.map(characteristic => ({
					id: characteristic.id,
					characteristicId: characteristic.characteristicId,
					value: characteristic.value,
					characteristic: characteristic.characteristic
				})),
				isActive: tier.isActive,
				sortOrder: tier.sortOrder
			})),
			isActive: creature.isActive,
			sortOrder: creature.sortOrder,
			createdAt: creature.createdAt.toISOString(),
			updatedAt: creature.updatedAt.toISOString()
		};
	}
}
