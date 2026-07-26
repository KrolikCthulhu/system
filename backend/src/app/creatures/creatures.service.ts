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
import { CreatureNaturalAttackDto } from './dto/creature-natural-attack.dto';
import { CreateCreatureDto } from './dto/create-creature.dto';
import { CreatureTierDto } from './dto/creature-tier.dto';
import { UpdateCreatureDto } from './dto/update-creature.dto';

const naturalAttackProfileSelect = {
	id: true,
	kind: true,
	name: true,
	skillId: true,
	skill: {
		select: {
			id: true,
			slug: true,
			name: true,
			categoryId: true,
			category: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			isActive: true,
			sortOrder: true
		}
	},
	characteristicId: true,
	characteristic: {
		select: {
			id: true,
			name: true,
			isActive: true,
			sortOrder: true
		}
	},
	baseCost: true,
	baseDamage: true,
	rangeMeters: true,
	usesAmmo: true,
	canBeParried: true,
	damageTypeLinks: {
		select: {
			damageTypeId: true,
			damageType: {
				select: {
					id: true,
					slug: true,
					name: true,
					isActive: true,
					sortOrder: true
				}
			}
		},
		orderBy: [{ sortOrder: 'asc' }]
	},
	intentLinks: {
		select: {
			id: true,
			combatIntentId: true,
			combatIntent: {
				select: {
					id: true,
					slug: true,
					name: true,
					category: true,
					isActive: true,
					sortOrder: true
				}
			},
			costModifier: true,
			damageModifier: true,
			ruleText: true,
			sortOrder: true
		},
		orderBy: [{ sortOrder: 'asc' }]
	},
	isActive: true,
	sortOrder: true
} satisfies Prisma.NaturalAttackProfileSelect;

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
	actions: true,
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
	naturalAttackLinks: {
		select: {
			id: true,
			naturalAttackId: true,
			attackProfiles: true,
			naturalAttack: {
				select: {
					id: true,
					slug: true,
					name: true,
					skillId: true,
					skill: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					attackProfiles: {
						select: naturalAttackProfileSelect,
						orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
					}
				}
			},
			isActive: true,
			sortOrder: true
		},
		orderBy: [{ sortOrder: 'asc' }, { naturalAttack: { name: 'asc' } }]
	},
	tiers: {
		select: {
			id: true,
			tier: true,
			name: true,
			hp: true,
			sizeId: true,
			size: {
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					rank: true,
					isActive: true,
					sortOrder: true
				}
			},
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
			attackOverrides: true,
			abilities: true,
			actions: true,
			actionOverrides: true,
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
type NaturalAttackProfileRecord = Prisma.NaturalAttackProfileGetPayload<{
	select: typeof naturalAttackProfileSelect;
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
			creatureSizes,
			anatomySchemes,
			armorPresets,
			naturalAttacks,
			combatIntents,
			damageTypes,
			skills,
			characteristics,
			conditions
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
			this.prisma.creatureSize.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					rank: true,
					isActive: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { rank: 'asc' }, { name: 'asc' }]
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
			this.prisma.naturalAttack.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					skillId: true,
					skill: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					attackProfiles: {
						select: naturalAttackProfileSelect,
						orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
					},
					isActive: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.combatIntent.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					category: true,
					isActive: true,
					sortOrder: true
				},
				orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.damageType.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
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
			}),
			this.prisma.condition.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					isActive: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			creatures: creatures.map(item => this.mapCreature(item)),
			creatureTypes,
			creatureSizes,
			anatomySchemes,
			armorPresets,
			naturalAttacks: naturalAttacks.map(attack => ({
				...attack,
				attackProfiles: attack.attackProfiles.map(profile =>
					this.mapNaturalAttackProfile(profile)
				)
			})),
			combatIntents,
			damageTypes,
			skills,
			characteristics,
			conditions
		};
	}

	async createCreature(dto: CreateCreatureDto) {
		await this.ensureReferences(
			dto.typeId,
			dto.anatomySchemeId,
			dto.tiers,
			dto.naturalAttacks ?? []
		);

		try {
			const creature = await this.prisma.$transaction(async tx => {
				const created = await tx.creature.create({
					select: { id: true },
					data: {
						slug: createSlug(dto.name),
						name: dto.name.trim(),
						typeId: dto.typeId,
						anatomySchemeId: dto.anatomySchemeId ?? null,
						actions: normalizeCreatureTierActions(
							dto.actions
						) as Prisma.InputJsonValue,
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
				await this.replaceCreatureNaturalAttacks(
					tx,
					created.id,
					dto.naturalAttacks ?? []
				);

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
			dto.tiers ?? [],
			dto.naturalAttacks ?? []
		);

		try {
			const creature = await this.prisma.$transaction(async tx => {
				await tx.creature.update({
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						typeId: dto.typeId,
						anatomySchemeId: dto.anatomySchemeId,
						actions:
							dto.actions === undefined
								? undefined
								: (normalizeCreatureTierActions(
										dto.actions
									) as Prisma.InputJsonValue),
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
				if (dto.naturalAttacks) {
					await this.replaceCreatureNaturalAttacks(tx, id, dto.naturalAttacks);
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
		tiers: CreatureTierDto[],
		naturalAttacks: CreatureNaturalAttackDto[]
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
		const sizeIds = [
			...new Set(
				tiers.map(tier => tier.sizeId).filter((id): id is string => Boolean(id))
			)
		];
		const skillIds = [
			...new Set([
				...tiers.flatMap(tier => tier.skills.map(skill => skill.skillId)),
				...naturalAttacks.flatMap(item =>
					(item.attackProfiles ?? []).map(profile => profile.skillId)
				)
			])
		];
		const characteristicIds = [
			...new Set(
				[
					...naturalAttacks
						.flatMap(item =>
							(item.attackProfiles ?? []).map(
								profile => profile.characteristicId
							)
						)
						.filter((id): id is string => Boolean(id)),
					tiers.flatMap(tier =>
						tier.characteristics.map(
							characteristic => characteristic.characteristicId
						)
					)
				].flat()
			)
		];
		const naturalAttackIds = [
			...new Set(naturalAttacks.map(item => item.naturalAttackId))
		];
		const damageTypeIds = [
			...new Set(
				naturalAttacks.flatMap(item =>
					(item.attackProfiles ?? []).flatMap(
						profile => profile.damageTypeIds ?? []
					)
				)
			)
		];
		const combatIntentIds = [
			...new Set(
				naturalAttacks.flatMap(item =>
					(item.attackProfiles ?? []).flatMap(profile =>
						(profile.intents ?? []).map(intent => intent.combatIntentId)
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

		if (sizeIds.length) {
			const count = await this.prisma.creatureSize.count({
				where: { id: { in: sizeIds } }
			});

			if (count !== sizeIds.length) {
				throw new BadRequestException('Размер существа не найден.');
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

		if (naturalAttackIds.length) {
			const count = await this.prisma.naturalAttack.count({
				where: { id: { in: naturalAttackIds } }
			});

			if (count !== naturalAttackIds.length) {
				throw new BadRequestException('Естественная атака не найдена.');
			}
		}

		if (damageTypeIds.length) {
			const count = await this.prisma.damageType.count({
				where: { id: { in: damageTypeIds } }
			});

			if (count !== damageTypeIds.length) {
				throw new BadRequestException('Тип урона не найден.');
			}
		}

		if (combatIntentIds.length) {
			const count = await this.prisma.combatIntent.count({
				where: { id: { in: combatIntentIds } }
			});

			if (count !== combatIntentIds.length) {
				throw new BadRequestException('Боевое намерение не найдено.');
			}
		}
	}

	private toTierCreateData(tier: CreatureTierDto) {
		return {
			tier: tier.tier,
			name: tier.name.trim(),
			hp: tier.hp,
			sizeId: tier.sizeId ?? null,
			armorPresetId: tier.armorPresetId ?? null,
			attackOverrides: normalizeCreatureTierAttackOverrides(
				tier.attackOverrides
			) as Prisma.InputJsonValue,
			abilities: normalizeCreatureTierAbilities(
				tier.abilities
			) as Prisma.InputJsonValue,
			actions: normalizeCreatureTierActions(
				tier.actions
			) as Prisma.InputJsonValue,
			actionOverrides: normalizeCreatureTierActions(
				tier.actionOverrides
			) as Prisma.InputJsonValue,
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

	private async replaceCreatureNaturalAttacks(
		tx: Prisma.TransactionClient,
		creatureId: string,
		naturalAttacks: CreatureNaturalAttackDto[]
	) {
		const naturalAttackIds = naturalAttacks.map(item => item.naturalAttackId);

		if (new Set(naturalAttackIds).size !== naturalAttackIds.length) {
			throw new BadRequestException('Естественная атака указана дважды.');
		}

		await tx.creatureNaturalAttack.deleteMany({ where: { creatureId } });

		for (const [index, naturalAttack] of naturalAttacks.entries()) {
			const attackProfiles =
				naturalAttack.attackProfiles ??
				(await this.defaultCreatureNaturalAttackProfiles(
					tx,
					naturalAttack.naturalAttackId
				));

			await tx.creatureNaturalAttack.create({
				data: {
					creatureId,
					naturalAttackId: naturalAttack.naturalAttackId,
					attackProfiles: this.toCreatureNaturalAttackProfiles(attackProfiles),
					isActive: naturalAttack.isActive ?? true,
					sortOrder: naturalAttack.sortOrder ?? index
				}
			});
		}
	}

	private async defaultCreatureNaturalAttackProfiles(
		tx: Prisma.TransactionClient,
		naturalAttackId: string
	): Promise<NonNullable<CreatureNaturalAttackDto['attackProfiles']>> {
		const profiles = await tx.naturalAttackProfile.findMany({
			select: naturalAttackProfileSelect,
			where: { naturalAttackId },
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return profiles.map(profile => ({
			kind: profile.kind === 'MELEE' ? ('melee' as const) : ('ranged' as const),
			name: profile.name,
			skillId: profile.skillId,
			characteristicId: profile.characteristicId,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo,
			canBeParried: profile.canBeParried,
			availabilityRules: [],
			damageTypeIds: profile.damageTypeLinks.map(link => link.damageTypeId),
			intents: profile.intentLinks.map(link => ({
				combatIntentId: link.combatIntentId,
				nameOverride: '',
				costModifier: link.costModifier,
				damageModifier: link.damageModifier,
				ruleText: link.ruleText ?? '',
				availabilityRules: [],
				sortOrder: link.sortOrder
			})),
			followupActions: [],
			isActive: profile.isActive,
			sortOrder: profile.sortOrder
		}));
	}

	private toCreatureNaturalAttackProfiles(
		profiles: NonNullable<CreatureNaturalAttackDto['attackProfiles']>
	): Prisma.InputJsonValue {
		return profiles.map((profile, index) => ({
			kind: profile.kind,
			name: profile.name.trim(),
			skillId: profile.skillId,
			characteristicId: profile.characteristicId ?? null,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo ?? false,
			canBeParried: profile.canBeParried ?? profile.kind === 'melee',
			availabilityRules: normalizeAttackAvailabilityRules(
				profile.availabilityRules
			),
			damageTypeIds: profile.damageTypeIds ?? [],
			intents: (profile.intents ?? []).map((intent, intentIndex) => ({
				combatIntentId: intent.combatIntentId,
				nameOverride: intent.nameOverride?.trim() ?? '',
				costModifier: intent.costModifier ?? 0,
				damageModifier: intent.damageModifier ?? 0,
				ruleText: intent.ruleText ?? '',
				availabilityRules: normalizeAttackAvailabilityRules(
					intent.availabilityRules
				),
				sortOrder: intent.sortOrder ?? intentIndex
			})),
			followupActions: (profile.followupActions ?? []).map(
				(action, actionIndex) => ({
					kind: action.kind ?? 'custom',
					name: action.name.trim(),
					costMode: action.costMode ?? 'fixed',
					costPotential: action.costPotential ?? null,
					costPerMeter: action.costPerMeter ?? null,
					damageMode: action.damageMode ?? 'none',
					appliesArmor: action.appliesArmor ?? false,
					conditionOnDamage: action.conditionOnDamage
						? {
								name: action.conditionOnDamage.name?.trim() ?? '',
								slug: action.conditionOnDamage.slug?.trim() ?? ''
							}
						: null,
					conditionLevel: action.conditionLevel ?? null,
					keepsGrab: action.keepsGrab ?? true,
					description: action.description?.trim() ?? '',
					availabilityRules: normalizeAttackAvailabilityRules(
						action.availabilityRules
					),
					isActive: action.isActive ?? true,
					sortOrder: action.sortOrder ?? actionIndex
				})
			),
			isActive: profile.isActive ?? true,
			sortOrder: profile.sortOrder ?? index
		}));
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
			naturalAttacks: creature.naturalAttackLinks.map(link => ({
				id: link.id,
				naturalAttackId: link.naturalAttackId,
				naturalAttack: {
					...link.naturalAttack,
					attackProfiles: link.naturalAttack.attackProfiles.map(profile =>
						this.mapNaturalAttackProfile(profile)
					)
				},
				attackProfiles: link.attackProfiles,
				isActive: link.isActive,
				sortOrder: link.sortOrder
			})),
			actions: normalizeCreatureTierActions(creature.actions),
			tiers: creature.tiers.map(tier => ({
				id: tier.id,
				tier: tier.tier,
				name: tier.name,
				hp: tier.hp,
				sizeId: tier.sizeId,
				size: tier.size,
				armorPresetId: tier.armorPresetId,
				armorPreset: tier.armorPreset,
				attackOverrides: normalizeCreatureTierAttackOverrides(
					tier.attackOverrides
				),
				abilities: normalizeCreatureTierAbilities(tier.abilities),
				actions: normalizeCreatureTierActions(tier.actions),
				actionOverrides: normalizeCreatureTierActions(tier.actionOverrides),
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

	private mapNaturalAttackProfile(profile: NaturalAttackProfileRecord) {
		return {
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
			availabilityRules: [],
			damageTypeIds: profile.damageTypeLinks.map(link => link.damageTypeId),
			damageTypes: profile.damageTypeLinks.map(link => link.damageType),
			isActive: profile.isActive,
			sortOrder: profile.sortOrder,
			intents: profile.intentLinks.map(link => ({
				id: link.id,
				combatIntentId: link.combatIntentId,
				combatIntent: link.combatIntent,
				nameOverride: '',
				costModifier: link.costModifier,
				damageModifier: link.damageModifier,
				ruleText: link.ruleText ?? '',
				availabilityRules: [],
				sortOrder: link.sortOrder
			})),
			followupActions: []
		};
	}
}

function normalizeAttackAvailabilityRules(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((rule, index) => {
		if (!isRecord(rule)) {
			return [];
		}

		const condition = isRecord(rule['condition']) ? rule['condition'] : null;

		return [
			{
				type: readAvailabilityRuleType(rule['type']),
				label: readOptionalString(rule, 'label'),
				resourceKey: readOptionalString(rule, 'resourceKey'),
				condition: condition
					? {
							name: readOptionalString(condition, 'name'),
							slug: readOptionalString(condition, 'slug')
						}
					: null,
				unavailableText: readOptionalString(rule, 'unavailableText'),
				sortOrder: readNumber(rule, 'sortOrder') ?? index
			}
		];
	});
}

function normalizeCreatureTierAttackOverrides(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!isRecord(item)) {
			return [];
		}

		const naturalAttack = isRecord(item['naturalAttack'])
			? item['naturalAttack']
			: {};

		return [
			{
				naturalAttack: {
					name: readOptionalString(naturalAttack, 'name'),
					slug: readOptionalString(naturalAttack, 'slug')
				},
				profileKind: readProfileKind(item['profileKind']),
				profileName: readOptionalString(item, 'profileName'),
				isAvailable: readBoolean(item, 'isAvailable') ?? true,
				costModifier: readNumber(item, 'costModifier') ?? 0,
				damageModifier: readNumber(item, 'damageModifier') ?? 0,
				rangeModifier: readNumber(item, 'rangeModifier') ?? 0,
				dicePoolModifier: readNumber(item, 'dicePoolModifier') ?? 0,
				sortOrder: readNumber(item, 'sortOrder') ?? index
			}
		];
	});
}

function normalizeCreatureTierAbilities(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!isRecord(item)) {
			return [];
		}

		const appliesCondition = isRecord(item['appliesCondition'])
			? item['appliesCondition']
			: null;

		return [
			{
				name: readOptionalString(item, 'name'),
				costPotential: readNumber(item, 'costPotential'),
				target: readOptionalString(item, 'target'),
				duration: readOptionalString(item, 'duration'),
				description: readOptionalString(item, 'description'),
				effectText: readOptionalString(item, 'effectText'),
				appliesCondition: appliesCondition
					? {
							name: readOptionalString(appliesCondition, 'name'),
							slug: readOptionalString(appliesCondition, 'slug')
						}
					: null,
				conditionDisplayName: readOptionalString(item, 'conditionDisplayName'),
				isActive: readBoolean(item, 'isActive') ?? true,
				sortOrder: readNumber(item, 'sortOrder') ?? index
			}
		];
	});
}

function normalizeCreatureTierActions(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!isRecord(item)) {
			return [];
		}

		return [
			{
				slug: readOptionalString(item, 'slug'),
				name: readOptionalString(item, 'name'),
				kind: readActionKind(item['kind']),
				source: normalizeCreatureActionSource(item['source']),
				cost: normalizeCreatureActionCost(item['cost']),
				target: normalizeCreatureActionTarget(item['target']),
				availabilityRules: normalizeAttackAvailabilityRules(
					item['availabilityRules']
				),
				roll: normalizeCreatureActionRoll(item['roll']),
				defense: normalizeCreatureActionDefense(item['defense']),
				effects: normalizeCreatureActionEffects(item['effects']),
				playerText: readOptionalString(item, 'playerText'),
				isActive: readBoolean(item, 'isActive') ?? true,
				sortOrder: readNumber(item, 'sortOrder') ?? index
			}
		];
	});
}

function normalizeCreatureActionSource(value: unknown) {
	if (!isRecord(value)) {
		return null;
	}

	const intent = isRecord(value['intent']) ? value['intent'] : null;

	return {
		type: readActionSourceType(value['type']),
		name: readOptionalString(value, 'name'),
		slug: readOptionalString(value, 'slug'),
		profileName: readOptionalString(value, 'profileName'),
		intent: intent
			? {
					name: readOptionalString(intent, 'name'),
					slug: readOptionalString(intent, 'slug')
				}
			: null
	};
}

function normalizeCreatureActionCost(value: unknown) {
	if (!isRecord(value)) {
		return {
			mode: 'free',
			potential: null,
			perMeter: null
		};
	}

	return {
		mode: readActionCostMode(value['mode']),
		potential: readNumber(value, 'potential'),
		perMeter: readNumber(value, 'perMeter')
	};
}

function normalizeCreatureActionTarget(value: unknown) {
	if (!isRecord(value)) {
		return null;
	}

	return {
		type: readActionTargetType(value['type']),
		visibility: readActionTargetVisibility(value['visibility']),
		description: readOptionalString(value, 'description')
	};
}

function normalizeCreatureActionRoll(value: unknown) {
	if (!isRecord(value)) {
		return null;
	}

	const characteristic = isRecord(value['characteristic'])
		? value['characteristic']
		: null;
	const skill = isRecord(value['skill']) ? value['skill'] : null;

	return {
		type: readActionRollType(value['type']),
		characteristic: characteristic
			? {
					name: readOptionalString(characteristic, 'name'),
					slug: readOptionalString(characteristic, 'slug')
				}
			: null,
		skill: skill
			? {
					name: readOptionalString(skill, 'name'),
					slug: readOptionalString(skill, 'slug')
				}
			: null
	};
}

function normalizeCreatureActionDefense(value: unknown) {
	if (!isRecord(value)) {
		return null;
	}

	return {
		type: readActionDefenseType(value['type']),
		canDodge: readBoolean(value, 'canDodge') ?? false,
		canParry: readBoolean(value, 'canParry') ?? false
	};
}

function normalizeCreatureActionEffects(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!isRecord(item)) {
			return [];
		}

		const damageType = isRecord(item['damageType']) ? item['damageType'] : null;
		const condition = isRecord(item['condition']) ? item['condition'] : null;

		return [
			{
				type: readActionEffectType(item['type']),
				value: readNumber(item, 'value'),
				damageMode: readDamageMode(item['damageMode']),
				damageType: damageType
					? {
							name: readOptionalString(damageType, 'name'),
							slug: readOptionalString(damageType, 'slug')
						}
					: null,
				condition: condition
					? {
							name: readOptionalString(condition, 'name'),
							slug: readOptionalString(condition, 'slug')
						}
					: null,
				conditionDisplayName: readOptionalString(item, 'conditionDisplayName'),
				conditionLevel: readNumber(item, 'conditionLevel'),
				targetScope: readEffectTargetScope(item['targetScope']),
				appliesArmor: readBoolean(item, 'appliesArmor') ?? false,
				requiresDamageAfterArmor:
					readBoolean(item, 'requiresDamageAfterArmor') ?? false,
				text: readOptionalString(item, 'text'),
				sortOrder: readNumber(item, 'sortOrder') ?? index
			}
		];
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOptionalString(
	value: Record<string, unknown>,
	key: string
): string {
	const field = value[key];
	return typeof field === 'string' ? field.trim() : '';
}

function readNumber(
	value: Record<string, unknown>,
	key: string
): number | null {
	const field = value[key];
	return typeof field === 'number' && Number.isFinite(field) ? field : null;
}

function readBoolean(
	value: Record<string, unknown>,
	key: string
): boolean | null {
	const field = value[key];
	return typeof field === 'boolean' ? field : null;
}

function readProfileKind(value: unknown): 'melee' | 'ranged' | null {
	return value === 'melee' || value === 'ranged' ? value : null;
}

function readAvailabilityRuleType(
	value: unknown
): 'resource_free' | 'active_condition' {
	return value === 'resource_free' || value === 'active_condition'
		? value
		: 'resource_free';
}

function readActionKind(
	value: unknown
): 'attack' | 'grab_action' | 'active_ability' | 'reaction' | 'passive' {
	return value === 'attack' ||
		value === 'grab_action' ||
		value === 'active_ability' ||
		value === 'reaction' ||
		value === 'passive'
		? value
		: 'active_ability';
}

function readActionSourceType(
	value: unknown
): 'natural_attack' | 'weapon' | 'condition' | 'ability' | 'custom' {
	return value === 'natural_attack' ||
		value === 'weapon' ||
		value === 'condition' ||
		value === 'ability' ||
		value === 'custom'
		? value
		: 'custom';
}

function readActionCostMode(
	value: unknown
): 'free' | 'fixed' | 'per_meter' | 'rule' {
	return value === 'free' ||
		value === 'fixed' ||
		value === 'per_meter' ||
		value === 'rule'
		? value
		: 'free';
}

function readActionTargetType(
	value: unknown
):
	| 'self'
	| 'creature'
	| 'hostile_creature'
	| 'held_target'
	| 'marked_target'
	| 'none' {
	return value === 'self' ||
		value === 'creature' ||
		value === 'hostile_creature' ||
		value === 'held_target' ||
		value === 'marked_target' ||
		value === 'none'
		? value
		: 'none';
}

function readActionTargetVisibility(value: unknown): 'visible' | 'any' {
	return value === 'visible' || value === 'any' ? value : 'any';
}

function readActionRollType(
	value: unknown
): 'none' | 'attack_profile' | 'check' {
	return value === 'none' || value === 'attack_profile' || value === 'check'
		? value
		: 'none';
}

function readActionDefenseType(
	value: unknown
): 'none' | 'target_physical_defense' {
	return value === 'none' || value === 'target_physical_defense'
		? value
		: 'none';
}

function readActionEffectType(
	value: unknown
):
	| 'damage'
	| 'apply_condition'
	| 'remove_condition'
	| 'create_grab'
	| 'release_grab'
	| 'move_with_grab'
	| 'dice_pool_modifier'
	| 'special_rule' {
	return value === 'damage' ||
		value === 'apply_condition' ||
		value === 'remove_condition' ||
		value === 'create_grab' ||
		value === 'release_grab' ||
		value === 'move_with_grab' ||
		value === 'dice_pool_modifier' ||
		value === 'special_rule'
		? value
		: 'special_rule';
}

function readDamageMode(
	value: unknown
): 'clean_successes' | 'clean_successes_plus_base' | 'base_damage' | null {
	return value === 'clean_successes' ||
		value === 'clean_successes_plus_base' ||
		value === 'base_damage'
		? value
		: null;
}

function readEffectTargetScope(
	value: unknown
):
	| 'holder'
	| 'source_against_holder'
	| 'source_group_against_holder'
	| 'all_creatures_against_holder'
	| null {
	return value === 'holder' ||
		value === 'source_against_holder' ||
		value === 'source_group_against_holder' ||
		value === 'all_creatures_against_holder'
		? value
		: null;
}
