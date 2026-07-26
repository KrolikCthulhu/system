import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	CreatureContent,
	CreatureTierActionContent,
	WeaponAttackProfileContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CREATURE_SEEDS = readContent<
	ContentDocument<{ creatures: CreatureContent[] }>
>('dictionaries/creatures.ts').creatures;

export async function seedCreatures(tx: Prisma.TransactionClient) {
	for (const seed of CREATURE_SEEDS) {
		const slug = seedSlug(seed);
		const type = await tx.creatureType.findFirstOrThrow({
			select: { id: true },
			where: {
				OR: [{ slug: seed.type.slug }, { name: seed.type.name }]
			}
		});
		const anatomyScheme = seed.anatomyScheme
			? await tx.anatomyScheme.findFirstOrThrow({
					select: { id: true },
					where: {
						OR: [
							{ slug: seed.anatomyScheme.slug },
							{ name: seed.anatomyScheme.name }
						]
					}
				})
			: null;
		const existing = await tx.creature.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});
		const creature = existing
			? await tx.creature.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						slug,
						name: seed.name,
						typeId: type.id,
						anatomySchemeId: anatomyScheme?.id ?? null,
						actions: normalizeTierActions(seed.actions),
						isActive: true,
						sortOrder: seed.sortOrder
					}
				})
			: await tx.creature.create({
					select: { id: true },
					data: {
						slug,
						name: seed.name,
						typeId: type.id,
						anatomySchemeId: anatomyScheme?.id ?? null,
						actions: normalizeTierActions(seed.actions),
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});

		await syncCreatureAnatomyFromScheme(
			tx,
			creature.id,
			anatomyScheme?.id ?? null
		);
		await seedCreatureNaturalAttacks(
			tx,
			creature.id,
			seed.naturalAttacks ?? []
		);

		const seedTiers = seed.tiers.map(tier => tier.tier);
		await tx.creatureTier.deleteMany({
			where: {
				creatureId: creature.id,
				tier: { notIn: seedTiers }
			}
		});

		for (const tierSeed of seed.tiers) {
			const armorPreset = await tx.armorPreset.findFirstOrThrow({
				select: { id: true },
				where: {
					OR: [
						{ slug: tierSeed.armorPreset.slug },
						{ name: tierSeed.armorPreset.name }
					]
				}
			});
			const sizeSeed = tierSeed.size ?? { name: 'Средний', slug: 'sredniy' };
			const size = await tx.creatureSize.findFirstOrThrow({
				select: { id: true },
				where: {
					OR: [{ slug: sizeSeed.slug }, { name: sizeSeed.name }]
				}
			});
			const tier = await tx.creatureTier.upsert({
				select: { id: true },
				where: {
					creatureId_tier: {
						creatureId: creature.id,
						tier: tierSeed.tier
					}
				},
				create: {
					creatureId: creature.id,
					tier: tierSeed.tier,
					name: tierSeed.name,
					hp: tierSeed.hp,
					sizeId: size.id,
					armorPresetId: armorPreset.id,
					attackOverrides: normalizeTierAttackOverrides(
						tierSeed.attackOverrides
					),
					abilities: normalizeTierAbilities(tierSeed.abilities),
					actions: normalizeTierActions(tierSeed.actions),
					actionOverrides: normalizeTierActions(tierSeed.actionOverrides),
					isActive: tierSeed.isActive ?? true,
					sortOrder: tierSeed.sortOrder ?? tierSeed.tier
				},
				update: {
					name: tierSeed.name,
					hp: tierSeed.hp,
					sizeId: size.id,
					armorPresetId: armorPreset.id,
					attackOverrides: normalizeTierAttackOverrides(
						tierSeed.attackOverrides
					),
					abilities: normalizeTierAbilities(tierSeed.abilities),
					actions: normalizeTierActions(tierSeed.actions),
					actionOverrides: normalizeTierActions(tierSeed.actionOverrides),
					isActive: tierSeed.isActive ?? true,
					sortOrder: tierSeed.sortOrder ?? tierSeed.tier
				}
			});
			const characteristicIds: string[] = [];
			const characteristicSeeds = tierSeed.characteristics ?? [];
			const defaultCharacteristics = await tx.characteristic.findMany({
				select: { id: true, name: true, defaultValue: true },
				where: { isActive: true }
			});

			for (const characteristic of defaultCharacteristics) {
				const characteristicSeed = characteristicSeeds.find(
					item => item.name === characteristic.name
				);
				characteristicIds.push(characteristic.id);
				await tx.creatureTierCharacteristic.upsert({
					where: {
						creatureTierId_characteristicId: {
							creatureTierId: tier.id,
							characteristicId: characteristic.id
						}
					},
					create: {
						creatureTierId: tier.id,
						characteristicId: characteristic.id,
						value:
							characteristicSeed?.value ??
							defaultCreatureCharacteristicValue(characteristic.defaultValue)
					},
					update: {
						value:
							characteristicSeed?.value ??
							defaultCreatureCharacteristicValue(characteristic.defaultValue)
					}
				});
			}

			await tx.creatureTierCharacteristic.deleteMany({
				where: {
					creatureTierId: tier.id,
					characteristicId: { notIn: characteristicIds }
				}
			});

			const skillIds: string[] = [];

			for (const skillSeed of tierSeed.skills) {
				const skill = await tx.skill.findFirstOrThrow({
					select: { id: true },
					where: {
						OR: [{ slug: skillSeed.slug }, { name: skillSeed.name }]
					}
				});
				skillIds.push(skill.id);
				await tx.creatureTierSkill.upsert({
					where: {
						creatureTierId_skillId: {
							creatureTierId: tier.id,
							skillId: skill.id
						}
					},
					create: {
						creatureTierId: tier.id,
						skillId: skill.id,
						level: skillSeed.level
					},
					update: {
						level: skillSeed.level
					}
				});
			}

			await tx.creatureTierSkill.deleteMany({
				where: {
					creatureTierId: tier.id,
					skillId: { notIn: skillIds }
				}
			});
		}
	}
}

async function seedCreatureNaturalAttacks(
	tx: Prisma.TransactionClient,
	creatureId: string,
	naturalAttackSeeds: NonNullable<CreatureContent['naturalAttacks']>
) {
	const naturalAttackIds: string[] = [];

	for (const [index, naturalAttackSeed] of naturalAttackSeeds.entries()) {
		const naturalAttack = await tx.naturalAttack.findFirstOrThrow({
			select: {
				id: true,
				attackProfiles: {
					select: {
						kind: true,
						name: true,
						skillId: true,
						characteristicId: true,
						baseCost: true,
						baseDamage: true,
						rangeMeters: true,
						usesAmmo: true,
						canBeParried: true,
						isActive: true,
						sortOrder: true,
						damageTypeLinks: {
							select: { damageTypeId: true },
							orderBy: [{ sortOrder: 'asc' }]
						},
						intentLinks: {
							select: {
								combatIntentId: true,
								costModifier: true,
								damageModifier: true,
								ruleText: true,
								sortOrder: true
							},
							orderBy: [{ sortOrder: 'asc' }]
						}
					},
					orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
				}
			},
			where: {
				OR: [{ slug: naturalAttackSeed.slug }, { name: naturalAttackSeed.name }]
			}
		});
		const attackProfiles = naturalAttackSeed.attackProfiles
			? await resolveCreatureNaturalAttackProfiles(
					tx,
					naturalAttackSeed.attackProfiles
				)
			: naturalAttack.attackProfiles.map(profile => ({
					kind: profile.kind === 'MELEE' ? 'melee' : 'ranged',
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
		naturalAttackIds.push(naturalAttack.id);
		await tx.creatureNaturalAttack.upsert({
			where: {
				creatureId_naturalAttackId: {
					creatureId,
					naturalAttackId: naturalAttack.id
				}
			},
			create: {
				creatureId,
				naturalAttackId: naturalAttack.id,
				attackProfiles,
				isActive: true,
				sortOrder: index
			},
			update: {
				attackProfiles,
				isActive: true,
				sortOrder: index
			}
		});
	}

	await tx.creatureNaturalAttack.deleteMany({
		where: {
			creatureId,
			naturalAttackId: { notIn: naturalAttackIds }
		}
	});
}

async function resolveCreatureNaturalAttackProfiles(
	tx: Prisma.TransactionClient,
	profiles: WeaponAttackProfileContent[]
) {
	const resolvedProfiles = [];

	for (const [profileIndex, profile] of profiles.entries()) {
		const skill = await tx.skill.findFirstOrThrow({
			select: { id: true },
			where: {
				OR: [{ slug: profile.skill.slug }, { name: profile.skill.name }]
			}
		});
		const characteristic = await tx.characteristic.findFirst({
			select: { id: true },
			where: {
				OR: [
					{ systemValue: { slug: profile.characteristic.slug } },
					{ name: profile.characteristic.name }
				]
			}
		});

		if (!characteristic) {
			throw new Error(
				`Характеристика "${profile.characteristic.name}" не найдена.`
			);
		}

		const damageTypeIds = [];
		for (const damageTypeSeed of profile.damageTypes ?? []) {
			const damageType = await tx.damageType.findUnique({
				select: { id: true },
				where: { slug: damageTypeSeed.slug }
			});

			if (!damageType) {
				throw new Error(`Тип урона "${damageTypeSeed.name}" не найден.`);
			}

			damageTypeIds.push(damageType.id);
		}

		const intents = [];
		for (const [intentIndex, intentSeed] of (
			profile.combatIntents ?? []
		).entries()) {
			const combatIntent = await tx.combatIntent.findUnique({
				select: { id: true },
				where: { slug: intentSeed.slug }
			});

			if (!combatIntent) {
				throw new Error(`Боевое намерение "${intentSeed.name}" не найдено.`);
			}

			intents.push({
				combatIntentId: combatIntent.id,
				nameOverride: intentSeed.nameOverride ?? '',
				costModifier: intentSeed.costModifier ?? 0,
				damageModifier: intentSeed.damageModifier ?? 0,
				ruleText: intentSeed.ruleText ?? '',
				availabilityRules: normalizeAttackAvailabilityRules(
					intentSeed.availabilityRules
				),
				sortOrder: intentIndex
			});
		}

		resolvedProfiles.push({
			kind: profile.kind,
			name: profile.name,
			skillId: skill.id,
			characteristicId: characteristic.id,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo ?? false,
			canBeParried: profile.canBeParried ?? profile.kind === 'melee',
			availabilityRules: normalizeAttackAvailabilityRules(
				profile.availabilityRules
			),
			damageTypeIds,
			intents,
			followupActions: (profile.followupActions ?? []).map(
				(action, actionIndex) => ({
					kind: action.kind ?? 'custom',
					name: action.name,
					costMode: action.costMode ?? 'fixed',
					costPotential: action.costPotential ?? null,
					costPerMeter: action.costPerMeter ?? null,
					damageMode: action.damageMode ?? 'none',
					appliesArmor: action.appliesArmor ?? false,
					conditionOnDamage: action.conditionOnDamage
						? {
								name: action.conditionOnDamage.name,
								slug: action.conditionOnDamage.slug
							}
						: null,
					conditionLevel: action.conditionLevel ?? null,
					keepsGrab: action.keepsGrab ?? true,
					description: action.description ?? '',
					availabilityRules: normalizeAttackAvailabilityRules(
						action.availabilityRules
					),
					isActive: action.isActive ?? true,
					sortOrder: action.sortOrder ?? actionIndex
				})
			),
			isActive: profile.isActive ?? true,
			sortOrder: profile.sortOrder ?? profileIndex
		});
	}

	return resolvedProfiles;
}

function normalizeAttackAvailabilityRules(
	rules: WeaponAttackProfileContent['availabilityRules']
) {
	return (rules ?? []).map((rule, index) => ({
		type: rule.type,
		label: rule.label,
		resourceKey: rule.resourceKey ?? '',
		condition: rule.condition
			? {
					name: rule.condition.name,
					slug: rule.condition.slug
				}
			: null,
		unavailableText: rule.unavailableText ?? '',
		sortOrder: rule.sortOrder ?? index
	}));
}

function defaultCreatureCharacteristicValue(defaultValue: number): number {
	return Math.max(1, defaultValue);
}

function normalizeTierAttackOverrides(
	overrides: CreatureContent['tiers'][number]['attackOverrides']
): Prisma.InputJsonValue {
	return (overrides ?? []).map((override, index) => ({
		naturalAttack: {
			name: override.naturalAttack.name,
			slug: override.naturalAttack.slug
		},
		profileKind: override.profileKind ?? null,
		profileName: override.profileName ?? '',
		isAvailable: override.isAvailable ?? true,
		costModifier: override.costModifier ?? 0,
		damageModifier: override.damageModifier ?? 0,
		rangeModifier: override.rangeModifier ?? 0,
		dicePoolModifier: override.dicePoolModifier ?? 0,
		sortOrder: override.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function normalizeTierAbilities(
	abilities: CreatureContent['tiers'][number]['abilities']
): Prisma.InputJsonValue {
	return (abilities ?? []).map((ability, index) => ({
		name: ability.name,
		costPotential: ability.costPotential ?? null,
		target: ability.target ?? '',
		duration: ability.duration ?? '',
		description: ability.description ?? '',
		effectText: ability.effectText ?? '',
		appliesCondition: ability.appliesCondition
			? {
					name: ability.appliesCondition.name,
					slug: ability.appliesCondition.slug
				}
			: null,
		conditionDisplayName: ability.conditionDisplayName ?? '',
		isActive: ability.isActive ?? true,
		sortOrder: ability.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function normalizeTierActions(
	actions: CreatureTierActionContent[] | undefined
): Prisma.InputJsonValue {
	return (actions ?? []).map((action, actionIndex) => ({
		slug: action.slug,
		name: action.name,
		kind: action.kind,
		source: action.source
			? {
					type: action.source.type,
					name: action.source.name ?? '',
					slug: action.source.slug ?? '',
					profileName: action.source.profileName ?? '',
					intent: action.source.intent
						? {
								name: action.source.intent.name,
								slug: action.source.intent.slug
							}
						: null
				}
			: null,
		cost: {
			mode: action.cost.mode,
			potential: action.cost.potential ?? null,
			perMeter: action.cost.perMeter ?? null
		},
		target: action.target
			? {
					type: action.target.type,
					visibility: action.target.visibility ?? 'any',
					description: action.target.description ?? ''
				}
			: null,
		availabilityRules: normalizeAttackAvailabilityRules(
			action.availabilityRules
		),
		roll: action.roll
			? {
					type: action.roll.type,
					characteristic: action.roll.characteristic
						? {
								name: action.roll.characteristic.name,
								slug: action.roll.characteristic.slug
							}
						: null,
					skill: action.roll.skill
						? {
								name: action.roll.skill.name,
								slug: action.roll.skill.slug
							}
						: null
				}
			: null,
		defense: action.defense
			? {
					type: action.defense.type,
					canDodge: action.defense.canDodge ?? false,
					canParry: action.defense.canParry ?? false
				}
			: null,
		effects: (action.effects ?? []).map((effect, effectIndex) => ({
			type: effect.type,
			value: effect.value ?? null,
			damageMode: effect.damageMode ?? null,
			damageType: effect.damageType
				? {
						name: effect.damageType.name,
						slug: effect.damageType.slug
					}
				: null,
			condition: effect.condition
				? {
						name: effect.condition.name,
						slug: effect.condition.slug
					}
				: null,
			conditionDisplayName: effect.conditionDisplayName ?? '',
			conditionLevel: effect.conditionLevel ?? null,
			targetScope: effect.targetScope ?? null,
			appliesArmor: effect.appliesArmor ?? false,
			requiresDamageAfterArmor: effect.requiresDamageAfterArmor ?? false,
			text: effect.text ?? '',
			sortOrder: effect.sortOrder ?? effectIndex
		})),
		playerText: action.playerText ?? '',
		isActive: action.isActive ?? true,
		sortOrder: action.sortOrder ?? actionIndex
	})) as Prisma.InputJsonValue;
}

async function syncCreatureAnatomyFromScheme(
	tx: Prisma.TransactionClient,
	creatureId: string,
	schemeId: string | null
) {
	if (!schemeId) {
		await tx.creatureAnatomyZone.deleteMany({
			where: {
				creatureId,
				isInherited: true,
				overriddenFields: { isEmpty: true }
			}
		});
		return;
	}

	const schemeZones = await tx.anatomySchemeZone.findMany({
		where: { schemeId },
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	});
	const sourceZoneIds = new Set(schemeZones.map(zone => zone.id));

	await tx.creatureAnatomyZone.deleteMany({
		where: {
			creatureId,
			isInherited: true,
			overriddenFields: { isEmpty: true },
			sourceZoneId: { notIn: [...sourceZoneIds] }
		}
	});

	const existingZones = await tx.creatureAnatomyZone.findMany({
		where: { creatureId },
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	});
	const existingBySourceId = new Map(
		existingZones
			.filter(zone => zone.sourceZoneId)
			.map(zone => [zone.sourceZoneId as string, zone])
	);
	const existingBySlug = new Map(existingZones.map(zone => [zone.slug, zone]));
	const syncedZoneIdsBySourceId = new Map<string, string>();
	const orderedSchemeZones = [
		...schemeZones.filter(zone => !zone.parentId),
		...schemeZones.filter(zone => zone.parentId)
	];

	for (const schemeZone of orderedSchemeZones) {
		const existingZone =
			existingBySourceId.get(schemeZone.id) ??
			existingBySlug.get(schemeZone.slug);
		const parentId = schemeZone.parentId
			? (syncedZoneIdsBySourceId.get(schemeZone.parentId) ?? null)
			: null;

		if (existingZone) {
			const overriddenFields = new Set(existingZone.overriddenFields);
			const updated = await tx.creatureAnatomyZone.update({
				select: { id: true },
				where: { id: existingZone.id },
				data: {
					sourceZoneId: schemeZone.id,
					name: overriddenFields.has('name') ? undefined : schemeZone.name,
					parentId: overriddenFields.has('parentId') ? undefined : parentId,
					kind: overriddenFields.has('kind') ? undefined : schemeZone.kind,
					isRandomHitEligible: overriddenFields.has('isRandomHitEligible')
						? undefined
						: schemeZone.isRandomHitEligible,
					randomHitWeight: overriddenFields.has('randomHitWeight')
						? undefined
						: schemeZone.randomHitWeight,
					targetedAttackDicePenalty: overriddenFields.has(
						'targetedAttackDicePenalty'
					)
						? undefined
						: schemeZone.targetedAttackDicePenalty,
					extraPotentialCost: overriddenFields.has('extraPotentialCost')
						? undefined
						: schemeZone.extraPotentialCost,
					isActive: overriddenFields.has('isActive')
						? undefined
						: schemeZone.isActive,
					sortOrder: overriddenFields.has('sortOrder')
						? undefined
						: schemeZone.sortOrder,
					isInherited: true,
					isRemoved: false
				}
			});
			syncedZoneIdsBySourceId.set(schemeZone.id, updated.id);
			continue;
		}

		const created = await tx.creatureAnatomyZone.create({
			select: { id: true },
			data: {
				creatureId,
				sourceZoneId: schemeZone.id,
				parentId,
				slug: schemeZone.slug,
				name: schemeZone.name,
				kind: schemeZone.kind,
				isRandomHitEligible: schemeZone.isRandomHitEligible,
				randomHitWeight: schemeZone.randomHitWeight,
				targetedAttackDicePenalty: schemeZone.targetedAttackDicePenalty,
				extraPotentialCost: schemeZone.extraPotentialCost,
				overriddenFields: [],
				isInherited: true,
				isRemoved: false,
				isActive: schemeZone.isActive,
				sortOrder: schemeZone.sortOrder
			}
		});
		syncedZoneIdsBySourceId.set(schemeZone.id, created.id);
	}
}
