import {
	NaturalAttack,
	NaturalAttacksCatalog,
	Weapon,
	WeaponTemplate,
	WeaponsCatalog
} from '../../domain/weapons.models';
import {
	NaturalAttackDto,
	NaturalAttacksCatalogResponseDto,
	WeaponAttackProfileDto,
	WeaponCharacteristicOptionDto,
	WeaponDto,
	WeaponDamageTypeOptionDto,
	WeaponCombatIntentOptionDto,
	WeaponSkillOptionDto,
	WeaponTemplateDto,
	WeaponsCatalogResponseDto
} from '../dto/weapons.dto';

export function mapWeaponsCatalogResponseDto(
	dto: WeaponsCatalogResponseDto
): WeaponsCatalog {
	return {
		weapons: dto.weapons.map(mapWeaponDto),
		templates: dto.templates.map(mapWeaponTemplateDto),
		skills: dto.skills.map(mapWeaponSkillOptionDto),
		characteristics: dto.characteristics.map(mapWeaponCharacteristicOptionDto),
		combatIntents: dto.combatIntents.map(mapWeaponCombatIntentOptionDto),
		damageTypes: dto.damageTypes.map(mapWeaponDamageTypeOptionDto)
	};
}

export function mapWeaponDto(dto: WeaponDto): Weapon {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		templateId: dto.templateId,
		template: dto.template,
		skillId: dto.skillId,
		skill: mapWeaponSkillOptionDto(dto.skill),
		extraDamage: dto.extraDamage,
		attackProfiles: dto.attackProfiles.map(mapWeaponAttackProfileDto),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapWeaponAttackProfileDto(dto: WeaponAttackProfileDto) {
	return {
		id: dto.id,
		kind: dto.kind,
		name: dto.name,
		skillId: dto.skillId,
		skill: mapWeaponSkillOptionDto(dto.skill),
		characteristicId: dto.characteristicId,
		characteristic: dto.characteristic
			? mapWeaponCharacteristicOptionDto(dto.characteristic)
			: null,
		baseCost: dto.baseCost,
		baseDamage: dto.baseDamage,
		rangeMeters: dto.rangeMeters,
		usesAmmo: dto.usesAmmo,
		canBeParried: dto.canBeParried,
		damageTypeIds: dto.damageTypeIds,
		damageTypes: dto.damageTypes.map(mapWeaponDamageTypeOptionDto),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		intents: dto.intents.map(intent => ({
			id: intent.id,
			combatIntentId: intent.combatIntentId,
			combatIntent: mapWeaponCombatIntentOptionDto(intent.combatIntent),
			costModifier: intent.costModifier,
			damageModifier: intent.damageModifier,
			ruleText: intent.ruleText,
			sortOrder: intent.sortOrder
		}))
	};
}

export function mapWeaponTemplateDto(dto: WeaponTemplateDto): WeaponTemplate {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		skillId: dto.skillId,
		skill: mapWeaponSkillOptionDto(dto.skill),
		handsMin: dto.handsMin,
		handsMax: dto.handsMax,
		defaultHands: dto.defaultHands,
		attackProfiles: dto.attackProfiles.map(mapWeaponAttackProfileDto),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapNaturalAttacksCatalogResponseDto(
	dto: NaturalAttacksCatalogResponseDto
): NaturalAttacksCatalog {
	return {
		naturalAttacks: dto.naturalAttacks.map(mapNaturalAttackDto),
		skills: dto.skills.map(mapWeaponSkillOptionDto),
		characteristics: dto.characteristics.map(mapWeaponCharacteristicOptionDto),
		combatIntents: dto.combatIntents.map(mapWeaponCombatIntentOptionDto),
		damageTypes: dto.damageTypes.map(mapWeaponDamageTypeOptionDto)
	};
}

export function mapNaturalAttackDto(dto: NaturalAttackDto): NaturalAttack {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		skillId: dto.skillId,
		skill: mapWeaponSkillOptionDto(dto.skill),
		attackProfiles: dto.attackProfiles.map(mapWeaponAttackProfileDto),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapWeaponCombatIntentOptionDto(
	dto: WeaponCombatIntentOptionDto
) {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		category: dto.category,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder
	};
}

export function mapWeaponDamageTypeOptionDto(dto: WeaponDamageTypeOptionDto) {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder
	};
}

export function mapWeaponCharacteristicOptionDto(
	dto: WeaponCharacteristicOptionDto
) {
	return {
		id: dto.id,
		name: dto.name,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder
	};
}

export function mapWeaponSkillOptionDto(dto: WeaponSkillOptionDto) {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		categoryId: dto.categoryId,
		category: dto.category,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		searchText: `${dto.name} ${dto.category.name}`
	};
}
