import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { AnatomySyncService } from '../anatomy-schemes/anatomy-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreatureAnatomyZoneDto } from './dto/creature-anatomy-zone.dto';
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
	anatomySchemeId: true,
	anatomyScheme: {
		select: {
			id: true,
			slug: true,
			name: true
		}
	},
	anatomyZones: {
		select: {
			id: true,
			slug: true,
			name: true,
			sourceZoneId: true,
			parentId: true,
			kind: true,
			isRandomHitEligible: true,
			randomHitWeight: true,
			targetedAttackDicePenalty: true,
			extraPotentialCost: true,
			overriddenFields: true,
			isInherited: true,
			isRemoved: true,
			isActive: true,
			sortOrder: true
		},
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
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
	constructor(
		private readonly prisma: PrismaService,
		private readonly anatomySyncService: AnatomySyncService
	) {}

	async getCatalog() {
		const [
			creatures,
			creatureTypes,
			anatomySchemes,
			armorPresets,
			skills,
			characteristics
		] = await this.prisma.$transaction([
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
			this.prisma.anatomyScheme.findMany({
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
			anatomySchemes,
			armorPresets,
			skills,
			characteristics
		};
	}

	async createCreature(dto: CreateCreatureDto) {
		await this.ensureReferences(dto.typeId, dto.anatomySchemeId, dto.tiers);

		try {
			const creature = await this.prisma.$transaction(async tx => {
				const created = await tx.creature.create({
					select: { id: true },
					data: {
						slug: createSlug(dto.name),
						name: dto.name.trim(),
						typeId: dto.typeId,
						anatomySchemeId: dto.anatomySchemeId ?? null,
						isActive: dto.isActive ?? true,
						sortOrder: dto.sortOrder ?? 0,
						tiers: {
							create: dto.tiers.map(tier => this.toTierCreateData(tier))
						}
					}
				});

				await this.anatomySyncService.syncCreatureAnatomyFromScheme(
					tx,
					created.id,
					dto.anatomySchemeId
				);

				if (dto.anatomyZones?.length) {
					await this.replaceCreatureAnatomyZones(
						tx,
						created.id,
						dto.anatomyZones
					);
				}

				return tx.creature.findUniqueOrThrow({
					select: creatureSelect,
					where: { id: created.id }
				});
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
		await this.ensureReferences(
			dto.typeId,
			dto.anatomySchemeId,
			dto.tiers ?? []
		);

		try {
			const creature = await this.prisma.$transaction(async tx => {
				await tx.creature.update({
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						typeId: dto.typeId,
						anatomySchemeId: dto.anatomySchemeId,
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

				if (dto.anatomySchemeId !== undefined) {
					await this.anatomySyncService.syncCreatureAnatomyFromScheme(
						tx,
						id,
						dto.anatomySchemeId
					);
				}

				if (dto.anatomyZones) {
					await this.replaceCreatureAnatomyZones(tx, id, dto.anatomyZones);
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
		anatomySchemeId: string | null | undefined,
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

		if (anatomySchemeId) {
			const scheme = await this.prisma.anatomyScheme.findUnique({
				select: { id: true },
				where: { id: anatomySchemeId }
			});

			if (!scheme) {
				throw new BadRequestException('Анатомическая схема не найдена.');
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

	private async replaceCreatureAnatomyZones(
		tx: Prisma.TransactionClient,
		creatureId: string,
		zones: CreatureAnatomyZoneDto[]
	) {
		this.validateAnatomyZones(zones);

		const zoneIdsByClientKey = new Map<string, string>();
		const orderedZones = zones.map((zone, index) => ({
			...zone,
			sortOrder: zone.sortOrder ?? index,
			slug: zone.slug?.trim() || createSlug(zone.name)
		}));

		for (const zone of orderedZones.filter(item => !item.parentId)) {
			const saved = await this.upsertCreatureAnatomyZone(
				tx,
				creatureId,
				null,
				zone
			);
			zoneIdsByClientKey.set(zone.id ?? zone.slug, saved.id);
		}

		for (const zone of orderedZones.filter(item => item.parentId)) {
			const parentId = zoneIdsByClientKey.get(zone.parentId ?? '');

			if (!parentId) {
				throw new BadRequestException(
					`Родительская зона для «${zone.name}» не найдена.`
				);
			}

			const saved = await this.upsertCreatureAnatomyZone(
				tx,
				creatureId,
				parentId,
				zone
			);
			zoneIdsByClientKey.set(zone.id ?? zone.slug, saved.id);
		}
	}

	private async upsertCreatureAnatomyZone(
		tx: Prisma.TransactionClient,
		creatureId: string,
		parentId: string | null,
		zone: CreatureAnatomyZoneDto & { slug: string; sortOrder: number }
	) {
		const existing = zone.id
			? await tx.creatureAnatomyZone.findFirst({
					select: { id: true },
					where: { id: zone.id, creatureId }
				})
			: await tx.creatureAnatomyZone.findUnique({
					select: { id: true },
					where: {
						creatureId_slug: {
							creatureId,
							slug: zone.slug
						}
					}
				});
		const data = {
			creatureId,
			sourceZoneId: zone.sourceZoneId ?? null,
			parentId,
			slug: zone.slug,
			name: zone.name.trim(),
			kind: zone.kind,
			isRandomHitEligible: zone.isRandomHitEligible,
			randomHitWeight: zone.randomHitWeight,
			targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
			extraPotentialCost: zone.extraPotentialCost,
			overriddenFields: zone.overriddenFields ?? [],
			isInherited: zone.isInherited ?? Boolean(zone.sourceZoneId),
			isRemoved: zone.isRemoved ?? false,
			isActive: zone.isActive ?? true,
			sortOrder: zone.sortOrder
		} satisfies Prisma.CreatureAnatomyZoneUncheckedCreateInput;

		if (existing) {
			return tx.creatureAnatomyZone.update({
				select: { id: true },
				where: { id: existing.id },
				data
			});
		}

		return tx.creatureAnatomyZone.create({
			select: { id: true },
			data
		});
	}

	private validateAnatomyZones(zones: CreatureAnatomyZoneDto[]) {
		const names = new Set<string>();
		const clientKeys = new Set<string>();

		for (const zone of zones) {
			const name = zone.name.trim();

			if (!name) {
				throw new BadRequestException('Название зоны обязательно.');
			}

			if (names.has(name)) {
				throw new BadRequestException(`Зона «${name}» указана дважды.`);
			}

			names.add(name);
			clientKeys.add(zone.id ?? zone.slug ?? createSlug(name));

			if (zone.kind === 'MAIN' && zone.randomHitWeight < 1) {
				throw new BadRequestException(
					`Основная зона «${name}» должна иметь вес попадания не меньше 1.`
				);
			}
		}

		for (const zone of zones) {
			if (zone.parentId && !clientKeys.has(zone.parentId)) {
				throw new BadRequestException(
					`Родительская зона для «${zone.name}» не найдена.`
				);
			}
		}
	}

	private mapCreature(creature: CreatureRecord) {
		return {
			id: creature.id,
			slug: creature.slug,
			name: creature.name,
			typeId: creature.typeId,
			type: creature.type,
			anatomySchemeId: creature.anatomySchemeId,
			anatomyScheme: creature.anatomyScheme,
			anatomyZones: creature.anatomyZones.map(zone => ({
				id: zone.id,
				slug: zone.slug,
				name: zone.name,
				sourceZoneId: zone.sourceZoneId,
				parentId: zone.parentId,
				kind: zone.kind,
				isRandomHitEligible: zone.isRandomHitEligible,
				randomHitWeight: zone.randomHitWeight,
				targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
				extraPotentialCost: zone.extraPotentialCost,
				overriddenFields: zone.overriddenFields,
				isInherited: zone.isInherited,
				isRemoved: zone.isRemoved,
				isActive: zone.isActive,
				sortOrder: zone.sortOrder
			})),
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
