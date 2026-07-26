import { Creature, CreaturesCatalog } from '../../domain/creatures.models';
import {
	CreatureDto,
	CreatureNaturalAttackProfileDto,
	CreaturesCatalogResponseDto
} from '../dto/creatures.dto';

export function mapCreaturesCatalogResponseDto(
	dto: CreaturesCatalogResponseDto
): CreaturesCatalog {
	return {
		creatures: dto.creatures.map(mapCreatureDto),
		creatureTypes: dto.creatureTypes,
		anatomySchemes: dto.anatomySchemes,
		armorPresets: dto.armorPresets,
		naturalAttacks: dto.naturalAttacks.map(attack => ({
			...attack,
			attackProfiles: attack.attackProfiles.map(mapNaturalAttackProfileDto)
		})),
		combatIntents: dto.combatIntents,
		damageTypes: dto.damageTypes,
		skills: dto.skills,
		creatureSizes: dto.creatureSizes,
		characteristics: dto.characteristics,
		conditions: dto.conditions ?? []
	};
}

export function mapCreatureDto(dto: CreatureDto): Creature {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		typeId: dto.typeId,
		type: dto.type,
		anatomySchemeId: dto.anatomySchemeId,
		anatomyScheme: dto.anatomyScheme,
		anatomyZones: dto.anatomyZones,
		naturalAttacks: dto.naturalAttacks.map(attack => ({
			...attack,
			naturalAttack: {
				...attack.naturalAttack,
				attackProfiles: attack.naturalAttack.attackProfiles.map(
					mapNaturalAttackProfileDto
				)
			},
			attackProfiles: attack.attackProfiles.map(mapNaturalAttackProfileDto)
		})),
		actions: mapCreatureTierActions(dto.actions ?? []),
		tiers: dto.tiers.map(tier => ({
			...tier,
			attackOverrides: (tier.attackOverrides ?? []).map((override, index) => ({
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
			})),
			abilities: (tier.abilities ?? []).map((ability, index) => ({
				name: ability.name,
				costPotential: ability.costPotential ?? null,
				target: ability.target ?? '',
				duration: ability.duration ?? '',
				description: ability.description ?? '',
				effectText: ability.effectText ?? '',
				appliesCondition: ability.appliesCondition ?? null,
				conditionDisplayName: ability.conditionDisplayName ?? '',
				isActive: ability.isActive ?? true,
				sortOrder: ability.sortOrder ?? index
			})),
			actions: mapCreatureTierActions(tier.actions ?? []),
			actionOverrides: mapCreatureTierActions(tier.actionOverrides ?? []),
			targetSelection: {
				title: tier.targetSelection?.title ?? '',
				description: tier.targetSelection?.description ?? '',
				tacticText: tier.targetSelection?.tacticText ?? '',
				positionChecklist: tier.targetSelection?.positionChecklist ?? [],
				scoringRules: (tier.targetSelection?.scoringRules ?? []).map(
					(rule, ruleIndex) => ({
						key: rule.key,
						label: rule.label,
						points: rule.points,
						isActive: rule.isActive ?? true,
						sortOrder: rule.sortOrder ?? ruleIndex
					})
				)
			}
		})),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapCreatureTierActions(
	actions: CreatureDto['actions']
): Creature['actions'] {
	return actions.map((action, index) => ({
		slug: action.slug,
		name: action.name,
		kind: action.kind,
		source: action.source ?? null,
		cost: {
			mode: action.cost?.mode ?? 'free',
			potential: action.cost?.potential ?? null,
			perMeter: action.cost?.perMeter ?? null
		},
		target: action.target ?? null,
		availabilityRules: (action.availabilityRules ?? []).map(
			(rule, ruleIndex) => ({
				type: rule.type,
				label: rule.label,
				resourceKey: rule.resourceKey ?? '',
				condition: rule.condition ?? null,
				unavailableText: rule.unavailableText ?? '',
				sortOrder: rule.sortOrder ?? ruleIndex
			})
		),
		roll: action.roll ?? null,
		defense: action.defense ?? null,
		effects: (action.effects ?? []).map((effect, effectIndex) => ({
			type: effect.type,
			value: effect.value ?? null,
			damageMode: effect.damageMode ?? null,
			damageType: effect.damageType ?? null,
			condition: effect.condition ?? null,
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
		sortOrder: action.sortOrder ?? index
	}));
}

function mapNaturalAttackProfileDto(profile: CreatureNaturalAttackProfileDto) {
	return {
		...profile,
		availabilityRules: (profile.availabilityRules ?? []).map((rule, index) => ({
			type: rule.type,
			label: rule.label,
			resourceKey: rule.resourceKey ?? '',
			condition: rule.condition ?? null,
			unavailableText: rule.unavailableText ?? '',
			sortOrder: rule.sortOrder ?? index
		})),
		intents: profile.intents.map((intent, index) => ({
			...intent,
			nameOverride: intent.nameOverride ?? '',
			availabilityRules: (intent.availabilityRules ?? []).map(
				(rule, ruleIndex) => ({
					type: rule.type,
					label: rule.label,
					resourceKey: rule.resourceKey ?? '',
					condition: rule.condition ?? null,
					unavailableText: rule.unavailableText ?? '',
					sortOrder: rule.sortOrder ?? ruleIndex
				})
			),
			sortOrder: intent.sortOrder ?? index
		})),
		followupActions: (profile.followupActions ?? []).map((action, index) => ({
			kind: action.kind ?? 'custom',
			name: action.name,
			costMode: action.costMode ?? 'fixed',
			costPotential: action.costPotential ?? null,
			costPerMeter: action.costPerMeter ?? null,
			damageMode: action.damageMode ?? 'none',
			appliesArmor: action.appliesArmor ?? false,
			conditionOnDamage: action.conditionOnDamage ?? null,
			conditionLevel: action.conditionLevel ?? null,
			keepsGrab: action.keepsGrab ?? true,
			description: action.description ?? '',
			availabilityRules: (action.availabilityRules ?? []).map(
				(rule, ruleIndex) => ({
					type: rule.type,
					label: rule.label,
					resourceKey: rule.resourceKey ?? '',
					condition: rule.condition ?? null,
					unavailableText: rule.unavailableText ?? '',
					sortOrder: rule.sortOrder ?? ruleIndex
				})
			),
			isActive: action.isActive ?? true,
			sortOrder: action.sortOrder ?? index
		}))
	};
}
